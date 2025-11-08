import { Request, Response, NextFunction } from "express";
import z, { ZodError, ZodSchema } from "zod";
import { BadRequestError } from "../utils/appError";

export const validate =
	<T>(schema: ZodSchema<T>) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync(req.body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const errorMessages = error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				}));

				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errorMessages,
				});
			} else {
				next(
					new BadRequestError(
						"An unexpected error occurred during validation.",
					),
				);
			}
		}
	};
