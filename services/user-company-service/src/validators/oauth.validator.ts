import { z } from "zod";

export const oauthSchema = z.object({
	email: z.string().email(),
	name: z.string().optional(),
	image: z.string().url().optional(),
});
export type OAuthSchema = z.infer<typeof oauthSchema>;
