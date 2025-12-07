const CHAT_SERVICE_URL =
	process.env.CHAT_SERVICE_URL || "http://localhost:8005";

/**
 * Thông báo cho chat service khi user bị xóa
 */
export const notifyChatServiceUserDeleted = async (
	userId: string,
	participantType: string = "USER",
): Promise<void> => {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

		const response = await fetch(
			`${CHAT_SERVICE_URL}/api/v1/internals/users/${userId}/deleted`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ participantType }),
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(
				`Chat service returned ${response.status}: ${response.statusText}`,
			);
		}

		console.log(
			`✅ Notified chat service about deleted user: ${userId}`,
		);
	} catch (error: any) {
		// Log error nhưng không throw để không ảnh hưởng đến quá trình xóa user
		console.error(
			`❌ Failed to notify chat service about deleted user ${userId}:`,
			error.message || error,
		);
		// Không throw error để việc xóa user vẫn tiếp tục ngay cả khi chat service không available
	}
};

/**
 * Thông báo cho chat service khi company bị xóa
 */
export const notifyChatServiceCompanyDeleted = async (
	companyId: string,
): Promise<void> => {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

		const response = await fetch(
			`${CHAT_SERVICE_URL}/api/v1/internals/users/${companyId}/deleted`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ participantType: "COMPANY" }),
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(
				`Chat service returned ${response.status}: ${response.statusText}`,
			);
		}

		console.log(
			`✅ Notified chat service about deleted company: ${companyId}`,
		);
	} catch (error: any) {
		// Log error nhưng không throw để không ảnh hưởng đến quá trình xóa company
		console.error(
			`❌ Failed to notify chat service about deleted company ${companyId}:`,
			error.message || error,
		);
		// Không throw error để việc xóa company vẫn tiếp tục ngay cả khi chat service không available
	}
};

