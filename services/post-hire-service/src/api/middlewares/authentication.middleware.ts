import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, USER_SERVICE_URL } from "@/common/enviroment";
import { APIError } from "@/common/error/api.error";
import axios from "axios";
import logger from "@/common/logger";

export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		let token;

		if (req.cookies?.workly_token) {
			token = req.cookies?.workly_token.trim();
		} else {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1].trim();
			}
		}

		if (!token) {
			throw new APIError({ message: "Token is required" });
		}
		const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

		let response
		try {
			response = await axios.get(`${USER_SERVICE_URL}/auth/me`, {
				headers: {
					Cookie: req.headers.cookie,
					Authorization: req.headers.authorization,
				},
				withCredentials: true,
			});
		} catch (error) {
			console.log(error);
			response = null;
		}
		const data = response?.data?.data || null;

		if (decoded.id != data?.userId && data) {
			throw new APIError({ message: "userid invalid" });
		}

		req.user = {
			userId: data?.userId ?? decoded.id,
			email: data?.email,
			name: data?.name,
			role: data?.role,
		};
		next();
	} catch (error) {
		logger.error("isAuthenticated error", error);
		next(error);
	}
};

export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		let token;

		if (req.cookies?.workly_token) {
			token = req.cookies?.workly_token.trim();
		} else {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1].trim();
			}
		}

		if (!token) {
			return next();
		}
		const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

		let response
		try {
			response = await axios.get(`${USER_SERVICE_URL}/auth/me`, {
				headers: {
					Cookie: req.headers.cookie,
					Authorization: req.headers.authorization,
				},
				withCredentials: true,
			});
		} catch (error) {
			response = null;
		}
		const data = response?.data?.data || null;

		if (decoded.id != data?.userId && data) {
			throw new APIError({ message: "userid invalid" });
		}

		req.user = {
			userId: data?.userId ?? decoded.id,
			email: data?.email,
			name: data?.name,
			role: data?.role,
		};
		next();
	} catch (error) {
		logger.error("isAuthenticated error", error);
		next(error);
	}
};
