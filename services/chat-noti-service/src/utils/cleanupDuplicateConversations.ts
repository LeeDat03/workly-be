import { Conversation, Message } from "../models";
import { IConversation } from "../models/conversation.model";

/**
 * Script to cleanup duplicate conversations in the database
 * This happens when race condition created multiple conversations between same participants
 * 
 * Usage: Run this script once to clean up existing duplicates
 * After running this, the new retry logic in createOrGetConversation should prevent new duplicates
 */
export async function cleanupDuplicateConversations(): Promise<{
	duplicatesFound: number;
	conversationsDeleted: number;
	conversationsMerged: number;
}> {
	console.log("Starting cleanup of duplicate conversations...");

	const allConversations = await Conversation.find({}).sort({ lastMessageAt: -1 });

	// Group conversations by participant pairs
	const participantPairMap: Map<
		string,
		IConversation[]
	> = new Map();

	for (const conv of allConversations) {
		if (conv.participants.length !== 2) continue;

		// Create a unique key for this participant pair (sorted to ensure consistency)
		const [p1, p2] = conv.participants.sort((a, b) => {
			if (a.id === b.id) {
				return a.type.localeCompare(b.type);
			}
			return a.id.localeCompare(b.id);
		});

		const pairKey = `${p1.id}_${p1.type}_${p2.id}_${p2.type}`;

		if (!participantPairMap.has(pairKey)) {
			participantPairMap.set(pairKey, []);
		}

		participantPairMap.get(pairKey)!.push(conv);
	}

	let duplicatesFound = 0;
	let conversationsDeleted = 0;
	let conversationsMerged = 0;

	// Process each group
	for (const [pairKey, conversations] of participantPairMap.entries()) {
		if (conversations.length <= 1) continue; // No duplicates

		duplicatesFound += conversations.length - 1;
		console.log(
			`Found ${conversations.length} duplicate conversations for pair: ${pairKey}`
		);

		// Sort by: 1) Has messages (priority), 2) Most recent lastMessageAt, 3) Most recent createdAt
		conversations.sort((a, b) => {
			// Priority 1: Conversations with messages
			const aHasMessages = a.lastMessage ? 1 : 0;
			const bHasMessages = b.lastMessage ? 1 : 0;
			if (aHasMessages !== bHasMessages) {
				return bHasMessages - aHasMessages; // Conversations with messages first
			}

			// Priority 2: Most recent lastMessageAt
			const aTime = a.lastMessageAt ? a.lastMessageAt.getTime() : 0;
			const bTime = b.lastMessageAt ? b.lastMessageAt.getTime() : 0;
			if (aTime !== bTime) {
				return bTime - aTime; // Most recent first
			}

			// Priority 3: Most recent createdAt
			return b.createdAt.getTime() - a.createdAt.getTime();
		});

		// Keep the first one (most relevant), delete the rest
		const [keepConversation, ...duplicates] = conversations;

		console.log(`  Keeping conversation: ${keepConversation._id}`);
		console.log(`  Deleting ${duplicates.length} duplicates...`);

		// Merge messages from duplicates to the kept conversation
		for (const duplicate of duplicates) {
			try {
				// Find all messages in the duplicate conversation
				const messages = await Message.find({
					conversationId: duplicate._id,
				});

				if (messages.length > 0) {
					console.log(
						`  Merging ${messages.length} messages from ${duplicate._id} to ${keepConversation._id}`
					);

					// Update messages to point to the kept conversation
					await Message.updateMany(
						{ conversationId: duplicate._id },
						{ $set: { conversationId: keepConversation._id } }
					);

					conversationsMerged++;

					// Update the kept conversation's lastMessage and lastMessageAt if needed
					const latestMessage = messages[messages.length - 1];
					if (
						latestMessage &&
						(!keepConversation.lastMessageAt ||
							latestMessage.createdAt > keepConversation.lastMessageAt)
					) {
						(keepConversation as unknown as any).lastMessage = latestMessage._id;
						keepConversation.lastMessageAt = latestMessage.createdAt;
						await keepConversation.save();
					}
				}

				// Delete the duplicate conversation
				await Conversation.findByIdAndDelete(duplicate._id);
				conversationsDeleted++;

				console.log(`  Deleted conversation: ${duplicate._id}`);
			} catch (error) {
				console.error(
					`Error processing duplicate conversation ${duplicate._id}:`,
					error
				);
			}
		}
	}

	console.log("\nCleanup completed!");
	console.log(`Total duplicate conversations found: ${duplicatesFound}`);
	console.log(`Total conversations deleted: ${conversationsDeleted}`);
	console.log(`Total conversations with merged messages: ${conversationsMerged}`);

	return {
		duplicatesFound,
		conversationsDeleted,
		conversationsMerged,
	};
}

// If running this file directly
if (require.main === module) {
	// Import and connect to database
	import("../config/database").then(async ({ connectDatabase }) => {
		try {
			await connectDatabase();
			console.log("Connected to database");

			const result = await cleanupDuplicateConversations();
			console.log("\nFinal results:", result);

			process.exit(0);
		} catch (error) {
			console.error("Error during cleanup:", error);
			process.exit(1);
		}
	});
}

