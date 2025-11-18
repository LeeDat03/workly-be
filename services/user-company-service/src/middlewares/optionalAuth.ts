import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models";
import { LoggedInUserRequest } from "../types";

export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		let token;

		if (req.cookies?.token) {
			token = req.cookies.token.trim();
		} else {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1].trim();
			}
		}

		// If no token, continue without user
		if (!token) {
			return next();
		}

		try {
			const decoded = jwt.verify(
				token,
				config.jwt.secret,
			) as jwt.JwtPayload;

			console.log(decoded);
			const currentUser = await UserModel.findOne({
				where: { userId: decoded.id },
				plain: true,
			});
			console.log(currentUser);

			if (currentUser) {
				(req as LoggedInUserRequest).user = {
					userId: currentUser.userId,
					email: currentUser.email,
					name: currentUser.name,
					role: currentUser.role,
				};
			}
		} catch (error) {
			console.log("Invalid token in optionalAuth:", error);
		}

		next();
	} catch (error) {
		next();
	}
};
