import { Request, Response, NextFunction } from "express";
import { toUserProfileDTO, UpdateUserProfileSchema } from "../validators";
import { IndustryModel, UserModel } from "../models";
import { Op } from "neogma";
import { LoggedInUserRequest } from "../types";
import { BadRequestError, NotFoundError } from "../utils/appError";

const extractRelationshipData = (relationships: any[]) => {
	return relationships[0]?.target?.dataValues || null;
};

export const getAllUsers = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Math.min(Number(req.query.limit) || 20, 20);
		const offset = (page - 1) * limit;
		const search = String(req.query.search || "");

		const users = await UserModel.findMany({
			where: {
				name: {
					[Op.contains]: search,
				},
			},
			limit: limit,
			skip: offset,
			plain: true,
		});

		const usersDTO = users.map((user: any) => toUserProfileDTO(user));

		res.status(200).json({
			success: true,
			data: usersDTO,
			pagination: {
				page,
				limit,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const updateUser = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const data: UpdateUserProfileSchema = req.body;
		const userId = req.user!.userId;

		const { industryId, ...propertiesToUpdate } = data;

		const user = await UserModel.findOne({
			where: {
				userId,
			},
		});

		if (!user) {
			throw new NotFoundError("User not found");
		}

		Object.assign(user, propertiesToUpdate);

		await user.save();

		if (industryId !== undefined) {
			if (industryId === "") {
				await user.updateRelationships({
					alias: "Industry",
					disconnectAll: true,
				});
			} else {
				const industry = await IndustryModel.findOne({
					where: { industryId },
				});
				if (!industry) {
					throw new BadRequestError("Industry not found");
				}
				await user.updateRelationships({
					alias: "Industry",
					where: {
						params: { industryId },
					},
					disconnectAll: true,
					connect: true,
				});
			}
		}

		const industryRelationship = await user.findRelationships({
			alias: "Industry",
		});

		const industryData = extractRelationshipData(industryRelationship);

		const userProfile = toUserProfileDTO(user.dataValues, industryData);

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getAllUsers,
	updateUser,
};
