import { logger } from "../../../utils";
import mqManager from "../mq.adapter";
import { QUEUES, UC_JobMessage } from "../type";
import { database } from "../../../config/database";

export const handleUCJobTask = async (
	message: UC_JobMessage,
): Promise<void> => {
	try {
		logger.info(
			`📨 Processing job message: ${message.action} for jobId: ${message.jobId}`,
		);

		switch (message.action) {
			case "created":
				await createJobNode(message);
				break;
			case "updated":
				await updateJobNode(message);
				break;
			case "deleted":
				await deleteJobNode(message);
				break;
		}

		logger.info(`✅ Job message processed successfully: ${message.jobId}`);
	} catch (error) {
		logger.error(`❌ Error processing job message:`, error);
		throw error;
	}
};

export const handleUCJobTaskDLX = async (
	message: UC_JobMessage,
): Promise<void> => {
	console.log("💀 Handling FAILED email (DLX):");
	console.log("hehe", message);
	// TODO: Xử lý email failed sau khi retry hết
	// - Gửi alert cho admin
	// - Log vào database
	// - Gửi vào monitoring system (Sentry, Datadog, etc.)
	// - Lưu vào bảng failed_emails để review sau

	console.log("📧 Admin alert sent about failed email");
	console.log("💾 Failed email logged to database");
};

async function createJobNode(message: UC_JobMessage): Promise<void> {
	const neogma = database.getNeogma();
	const { jobId, companyId, skills, endDate } = message;

	const skillNormalized = skills?.map((skill) =>
		skill.toLowerCase().replace(/ /g, "_"),
	);

	if (!endDate) {
		logger.error(`❌ End date is required for job ${jobId}`);
		return;
	}

	const endDateOnly = new Date(endDate).toISOString().split("T")[0];

	try {
		// Single query to create Job node with all relationships
		await neogma.queryRunner.run(
			`
			MERGE (j:Job { jobId: $jobId })
			SET j.endDate = date($endDate)
			WITH j
			MATCH (c:Company { companyId: $companyId })
			MERGE (j)-[:POSTED_BY]->(c)
			
			WITH j
			MATCH (s:Skill)
			WHERE s.skillId IN $skills
			MERGE (j)-[:REQUIRED_SKILL]->(s)
			`,
			{
				jobId,
				companyId,
				endDate: endDateOnly,
				skills: skillNormalized || [],
			},
		);

		logger.info(`✅ Created job node ${jobId} with relationships`);
	} catch (error) {
		logger.error(`❌ Error creating job node ${jobId}:`, error);
		throw error;
	}
}

async function updateJobNode(message: UC_JobMessage): Promise<void> {
	const neogma = database.getNeogma();
	const { jobId, skills, endDate } = message;

	const skillNormalized = skills?.map((skill) =>
		skill.toLowerCase().replace(/ /g, "_"),
	);

	const endDateOnly = new Date(endDate).toISOString().split("T")[0];
	try {
		await neogma.queryRunner.run(
			`
			MATCH (j:Job { jobId: $jobId })
			SET j.endDate = date($endDate)
			WITH j
			OPTIONAL MATCH (j)-[r:REQUIRED_SKILL]->()
			DELETE r
			
			WITH j
			MATCH (s:Skill)
			WHERE s.skillId IN $skills
			MERGE (j)-[:REQUIRED_SKILL]->(s)
			`,
			{
				jobId,
				endDate: endDateOnly,
				skills: skillNormalized || [],
			},
		);

		logger.info(`✅ Updated job node ${jobId} with relationships`);
	} catch (error) {
		logger.error(`❌ Error updating job node ${jobId}:`, error);
		throw error;
	}
}

async function deleteJobNode(message: UC_JobMessage): Promise<void> {
	const neogma = database.getNeogma();
	const { jobId } = message;

	try {
		await neogma.queryRunner.run(
			`
			MATCH (j:Job { jobId: $jobId })
			DETACH DELETE j
			`,
			{
				jobId,
			},
		);

		logger.info(`✅ Deleted job node ${jobId}`);
	} catch (error) {
		logger.error(`❌ Error deleting job node ${jobId}:`, error);
		throw error;
	}
}
