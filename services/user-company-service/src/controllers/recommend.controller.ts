import { NextFunction, Request, Response } from "express";
import {
	anonymousCompanyRecommendations,
	anonymousUserRecommendations,
	companyRecommendations,
	userRecommendations,
} from "../services/recommend.service";
import { parsePaginationQuery } from "../utils/pagination";

export const getUserRecommendations = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const paginationQuery = parsePaginationQuery(req.query);
		const user = (req as any).user;

		let recommendations;
		if (!user) {
			// Get recommendations for anonymous user
			recommendations =
				await anonymousUserRecommendations(paginationQuery);
		} else {
			recommendations = await userRecommendations(
				user.userId,
				paginationQuery,
			);
		}

		res.status(200).json({
			success: true,
			data: recommendations,
		});
	} catch (error) {
		next(error);
	}
};

export const getCompanyRecommendations = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const paginationQuery = parsePaginationQuery(req.query);
		const user = (req as any).user;

		let recommendations;
		if (!user) {
			// Get recommendations for anonymous user
			recommendations =
				await anonymousCompanyRecommendations(paginationQuery);
		} else {
			recommendations = await companyRecommendations(
				user.userId,
				paginationQuery,
			);
		}
		res.status(200).json({
			success: true,
			data: recommendations,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getUserRecommendations,
	getCompanyRecommendations,
};
