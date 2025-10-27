import { Request, Response, NextFunction } from "express";
import { userService } from "../services";
import { ApiResponse } from "../types";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userData = req.body;
		// console.log(userData);
		const user = await userService.createUser(userData);
		const response: ApiResponse = {
			success: true,
			data: user,
		};
		res.status(201).json(response);
	} catch (error) {
		next(error);
	}
};

export default {
	createUser,
};
