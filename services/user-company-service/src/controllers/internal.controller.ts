import { NextFunction, Request, Response } from "express";
import { Op } from "neogma";
import { CompanyModel, UserModel } from "../models";
import { BadRequestError } from "../utils/appError";
import { toUserFollowDTO } from "../validators/user.validator";

type BatchItemType = "USER" | "COMPANY";

interface BatchInputItem {
	id: string;
	type: BatchItemType;
}

const getBatchIds = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { ids } = req.body as { ids?: BatchInputItem[] };

		if (!Array.isArray(ids) || ids.length === 0) {
			throw new BadRequestError("ids must be a non-empty array");
		}

		const userIds = Array.from(
			new Set(
				ids
					.filter((item) => item.type === "USER" && item.id)
					.map((item) => item.id),
			),
		);

		const companyIds = Array.from(
			new Set(
				ids
					.filter((item) => item.type === "COMPANY" && item.id)
					.map((item) => item.id),
			),
		);

		const [users, companies] = await Promise.all([
			userIds.length
				? UserModel.findMany({
						where: {
							userId: {
								[Op.in]: userIds,
							},
						},
						plain: true,
					})
				: Promise.resolve([]),
			companyIds.length
				? CompanyModel.findMany({
						where: {
							companyId: {
								[Op.in]: companyIds,
							},
						},
						plain: true,
					})
				: Promise.resolve([]),
		]);

		const userMap = new Map(
			users.map((user: any) => [
				user.userId as string,
				toUserFollowDTO(user),
			]),
		);

		const companyMap = new Map(
			companies.map((company: any) => [
				company.companyId as string,
				company,
			]),
		);

		const result = ids.map((item) => {
			if (item.type === "USER") {
				return {
					...item,
					data: userMap.get(item.id) || null,
				};
			}

			if (item.type === "COMPANY") {
				return {
					...item,
					data: companyMap.get(item.id) || null,
				};
			}

			return {
				...item,
				data: null,
			};
		});

		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getBatchIds,
};
