import { Conversation } from "../models";

/**
 * Migration script to add participantKey to existing conversations
 * Run this once before deploying the unique constraint
 */
export async function addParticipantKeyToConversations(): Promise<{
	updated: number;
	skipped: number;
	errors: number;
}> {
	console.log(
		"Starting migration: Adding participantKey to conversations..."
	);

	const conversations = await Conversation.find({});
	let updated = 0;
	let skipped = 0;
	let errors = 0;

	for (const conv of conversations) {
		try {
			// Skip if already has participantKey
			if ((conv as any).participantKey) {
				skipped++;
				continue;
			}

			if (conv.participants.length !== 2) {
				console.warn(
					`Conversation ${conv._id} has ${conv.participants.length} participants, skipping`
				);
				skipped++;
				continue;
			}

			// Sort participants to create consistent key
			const [p1, p2] = conv.participants.sort((a, b) => {
				if (a.id === b.id) {
					return a.type.localeCompare(b.type);
				}
				return a.id.localeCompare(b.id);
			});

			const participantKey = `${p1.id}_${p1.type}_${p2.id}_${p2.type}`;

			// Update conversation
			await Conversation.updateOne(
				{ _id: conv._id },
				{ $set: { participantKey } }
			);

			updated++;
			console.log(
				`Updated conversation ${conv._id} with key: ${participantKey}`
			);
		} catch (error) {
			errors++;
			console.error(`Error updating conversation ${conv._id}:`, error);
		}
	}

	console.log("\nMigration completed!");
	console.log(`Updated: ${updated}`);
	console.log(`Skipped: ${skipped}`);
	console.log(`Errors: ${errors}`);

	return { updated, skipped, errors };
}

// If running this file directly
if (require.main === module) {
	import("../config/database").then(async ({ connectDatabase }) => {
		try {
			await connectDatabase();
			console.log("Connected to database");

			const result = await addParticipantKeyToConversations();
			console.log("\nFinal results:", result);

			process.exit(0);
		} catch (error) {
			console.error("Error during migration:", error);
			process.exit(1);
		}
	});
}
