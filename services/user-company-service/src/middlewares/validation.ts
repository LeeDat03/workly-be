import { Request, Response, NextFunction } from "express";
import z, { ZodError, ZodObject, ZodSchema } from "zod";
import { AppError } from "./errorHandler";

export const validate =
	(schema: ZodSchema) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			console.log(req.body);
			await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});
			next();
		} catch (error) {
			// TODO: handle validation error
			if (error instanceof ZodError) {
				const errorMessages = error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				}));

				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errorMessages,
				});
			} else {
				next(new AppError("Validation error", 400));
			}
		}
	};
