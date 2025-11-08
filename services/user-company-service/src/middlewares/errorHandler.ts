import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

const sendErrorDev = (err: AppError, res: Response) => {
	console.log(err);
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorProd = (err: AppError, res: Response) => {
	if (err.isOperational) {
		return res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	}

	console.error("ERROR 💥:", err);
	res.status(500).json({
		status: "error",
		message: "Something went very wrong!",
	});
};

export const globalErrorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || "error";

	if (process.env.NODE_ENV === "development") {
		sendErrorDev(err, res);
	} else if (process.env.NODE_ENV === "production") {
		let error = Object.assign(err);
		sendErrorProd(error, res);
	}
};
