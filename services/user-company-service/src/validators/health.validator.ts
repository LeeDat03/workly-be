import { z } from "zod";

export const healthCheckSchema = z.object({
	query: z.object({}).optional(),
	params: z.object({}).optional(),
	body: z.object({}).optional(),
});
