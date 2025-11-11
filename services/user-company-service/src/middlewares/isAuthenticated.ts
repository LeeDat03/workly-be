import { Request, Response, NextFunction } from "express";
import jwt, { Jwt } from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models";
import { UnauthorizedError } from "../utils/appError";
import { LoggedInUserRequest } from "../types";

export const isAuthenticated = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		let token = req.headers.authorization;

		if (!token) {
			throw new UnauthorizedError(
				"You are not logged in. Please log in to get access.",
			);
		}

		const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;

		const currentUser = await UserModel.findOne({
			where: { userId: decoded.id },
			plain: true,
		});
		console.log("reqreq", currentUser);
		if (!currentUser) {
			throw new UnauthorizedError("Invalid token, please log in again.");
		}

		req.user = {
			userId: currentUser.userId,
			email: currentUser.email,
			name: currentUser.name,
			role: currentUser.role,
		};

		next();
	} catch (error) {
		next(error);
	}
};
