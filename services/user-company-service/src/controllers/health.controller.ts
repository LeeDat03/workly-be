import { Request, Response, NextFunction } from "express";
import { healthService } from "../services";
import { ApiResponse } from "../types";

const checkHealth = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const healthStatus = await healthService.checkHealth();

		const response: ApiResponse = {
			success: true,
			data: healthStatus,
		};

		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
};

export default { checkHealth };
