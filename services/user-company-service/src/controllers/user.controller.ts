import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";
import { getUserModel, UserProperties, UserRole } from "../models/user.model";
import { CreateUserSchema } from "../validators";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userData: CreateUserSchema = req.body;
		console.log(userData);

		const UserModel = getUserModel();
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

export default {
	createUser,
};
