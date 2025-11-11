import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import {
	CreateUserSchema,
	ForgotPasswordSchema,
	ResetPasswordSchema,
	SigninSchema,
} from "../validators";
import { config } from "../config";
import { LoggedInUserRequest } from "../types";
import { OAuthSchema } from "../validators/oauth.validator";

const setCookie = (res: Response, token: string) => {
	res.cookie("token", token, {
		httpOnly: true,
		secure: config.env === "production",
		sameSite: "strict",
		maxAge: 24 * 60 * 60 * 1000 * 90,
	});
};

const COOKIE_NAME = "access_token";

const signup = async (
	req: Request<{}, {}, CreateUserSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { user, token } = await authService.signup(req.body);
		setCookie(res, token);
		res.status(201).json({
			success: true,
			message: "User created successfully",
			data: { user },
		});
	} catch (error) {
		next(error);
	}
};

const signin = async (
	req: Request<{}, {}, SigninSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { user, token } = await authService.signin(
			req.body.email,
			req.body.password,
		);

		setCookie(res, token);
		res.status(200).json({
			success: true,
			message: "Signed in successfully",
			data: { user, token },
		});
	} catch (error) {
		next(error);
	}
};

const signout = (req: Request, res: Response) => {
	res.clearCookie(COOKIE_NAME, {
		httpOnly: true,
		sameSite: "lax",
		secure: config.env === "production",
	});
	res.status(200).json({ success: true, message: "Signed out successfully" });
};

const handleOAuth = async (
	req: Request<{}, {}, OAuthSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { user, token } = await authService.findOrCreateUserByOAuth(
			req.body,
		);
		res.status(200).json({
			success: true,
			message: "Authenticated successfully",
			data: { user, token },
		});
	} catch (error) {
		next(error);
	}
};

const getMe = (req: LoggedInUserRequest, res: Response) => {
	res.status(200).json({ success: true, data: req.user });
};

const forgotPassword = async (
	req: Request<{}, {}, ForgotPasswordSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const result = await authService.forgotPassword(req.body.email);
		res.status(200).json({ success: true, ...result });
	} catch (err) {
		console.error("--- LỖI GỬI EMAIL ---");
		console.error(err);
		next(err);
	}
};

const resetPassword = async (
	req: Request<{}, {}, ResetPasswordSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { token } = req.params as { token: string };
		const { newPassword } = req.body;
		const result = await authService.resetPassword(token, newPassword);
		res.status(200).json({ success: true, ...result });
	} catch (error) {
		next(error);
	}
};

export default {
	signup,
	signin,
	signout,
	getMe,
	forgotPassword,
	resetPassword,
	handleOAuth,
};
