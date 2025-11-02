import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";
import { UserProperties, UserRole } from "../models/user.model";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { get } from "http";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userData: CreateUserSchema = req.body;
		console.log(userData);

		const newUserModel = await UserModel.createOne({
			...userData,
			role: UserRole.USER,
		} as UserProperties);
		const newUser = newUserModel.dataValues;

		const response: ApiResponse<UserProperties> = {
			success: true,
			data: newUser,
		};
		res.status(201).json(response);
	} catch (error) {
		next(error);
	}
};

export const getAllUsers = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const users = await UserModel.findMany();

		const usersWithoutPasswords = users.map((user) => {
			const { password, ...userSafe } = user;
			return userSafe;
		});

		res.status(200).json({
			success: true,
			data: usersWithoutPasswords,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	createUser,
	getAllUsers,
};
