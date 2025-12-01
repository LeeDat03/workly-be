import { Router, Request, Response, NextFunction } from "express";
import { LocationModel } from "../models";
import { Op } from "neogma";

const router = Router();

const getAllLocations = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Math.min(Number(req.query.limit) || 10, 20);
		const skip = (page - 1) * limit;
		const search = String(req.query.search || "");

		const whereCondition: any = {};
		if (search) {
			whereCondition.name = {
				[Op.contains]: search,
			};
		}

		const rawLocations = await LocationModel.findMany({
			where: whereCondition,
			limit: limit,
			skip: skip,
			order: [["name", "ASC"]],
		});

		const cleanLocations = rawLocations.map(
			(location: any) => location.dataValues,
		);

		res.status(200).json({
			success: true,
			message: "Locations retrieved successfully",
			data: cleanLocations,
			pagination: {
				page,
				limit,
			},
		});
	} catch (error) {
		next(error);
	}
};

router.get("/", getAllLocations);

export default router;
