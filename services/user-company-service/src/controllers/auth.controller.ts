import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { CreateUserSchema } from "../validators";
import { SigninSchema } from "../validators";
import { config } from "../config";

export const signup = async (
	req: Request<{}, {}, CreateUserSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const user = await authService.signup(req.body);
		res.status(201).json({
			success: true,
			message: "User created successfully",
			data: user,
		});
	} catch (error) {
		next(error);
	}
};

export const signin = async (
	req: Request<{}, {}, SigninSchema>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { user, token } = await authService.signin(
			req.body.email,
			req.body.password,
		);

		res.cookie("token", token, {
			httpOnly: true,
			secure: config.env === "production",
			sameSite: "strict",
			maxAge: 24 * 60 * 60 * 1000 * 90,
		});

		res.status(200).json({
			success: true,
			message: "Signed in successfully",
			data: { user, token },
		});
	} catch (error) {
		next(error);
	}
};

export const signout = (req: Request, res: Response) => {
	res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
	res.status(200).json({ success: true, message: "Signed out successfully" });
};
