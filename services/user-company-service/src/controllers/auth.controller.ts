import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import {
	CreateUserSchema,
	ForgotPasswordSchema,
	ResetPasswordSchema,
} from "../validators";
import { SigninSchema } from "../validators";
import { config } from "../config";
import { LoggedInUserRequest } from "../types";

const setCookie = (res: Response, token: string) => {
	res.cookie("token", token, {
		httpOnly: true,
		secure: config.env === "production",
		sameSite: "strict",
		maxAge: 24 * 60 * 60 * 1000 * 90,
	});
};

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
			data: { user, token },
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
	res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
	res.status(200).json({ success: true, message: "Signed out successfully" });
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
};
