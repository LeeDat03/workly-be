import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import {
	toUserProfileDTO,
	UpdateUserProfileSchema,
	UpdateUserSkillsSchema,
	UpdateUserIndustriesSchema,
	ChangePasswordSchema,
} from "../validators";
import { IndustryModel, SkillModel, UserModel } from "../models";
import { Op } from "neogma";
import { LoggedInUserRequest } from "../types";
import { NotFoundError, UnauthorizedError } from "../utils/appError";
import { IndustryProperties } from "../models/industry.model";
import { SkillProperties } from "../models/skill.model";
import { SchoolProperties } from "../models/school.model";

const updateRelations = async <T extends keyof typeof UserModel.relationships>(
	user: any,
	alias: T,
	newIds: string[] | undefined,
	Model: any,
	idField: string,
) => {
	if (newIds === undefined) return;

	const currentRels = await user.findRelationships({ alias });
	const currentIds = currentRels.map(
		(rel: any) => rel.target.dataValues[idField],
	);

	const toDelete = currentIds.filter((id: any) => !newIds.includes(id));
	for (const id of toDelete) {
		await UserModel.deleteRelationships({
			alias,
			where: {
				source: { userId: user.userId },
				target: { [idField]: id },
			},
		});
	}

	const toAdd = newIds.filter((id) => !currentIds.includes(id));
	for (const id of toAdd) {
		const item = await Model.findOne({ where: { [idField]: id } });
		if (item) {
			await user.relateTo({ alias, where: { [idField]: id } });
		}
	}
};

const getFullUserProfile = async (userId: string) => {
	const user = await UserModel.findOne({ where: { userId } });
	if (!user) {
		throw new NotFoundError("User not found");
	}

	const [industryRels, skillRels] = await Promise.all([
		user.findRelationships({ alias: "Industry" }),
		user.findRelationships({ alias: "Skill" }),
	]);

	const industryData = industryRels.map((rel: any) => rel.target.dataValues);
	const skillData = skillRels.map((rel: any) => rel.target.dataValues);

	const educationData = [];

	const educationRels = await user.findRelationships({ alias: "Education" });

	for (const eduRel of educationRels) {
		const education = eduRel.target;
		if (!education) continue;

		const schoolRels = await education.findRelationships({
			alias: "School",
		});
		const schoolData =
			schoolRels.length > 0 ? schoolRels[0].target.dataValues : null;

		educationData.push({
			...education.dataValues,
			school: schoolData,
		});
	}

	return toUserProfileDTO(
		user.dataValues,
		industryData as IndustryProperties[],
		skillData as SkillProperties[],
		educationData as any[],
	);
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
		});

		const usersDTO = await Promise.all(
			users.map(async (user) => {
				const [industryRels, skillRels] = await Promise.all([
					user.findRelationships({ alias: "Industry" }),
					user.findRelationships({ alias: "Skill" }),
				]);

				const industryData = industryRels.map(
					(rel: any) => rel.target.dataValues,
				);
				const skillData = skillRels.map(
					(rel: any) => rel.target.dataValues,
				);

				const educationData = [];
				const educationRels = await user.findRelationships({
					alias: "Education",
				});
				for (const eduRel of educationRels) {
					const education = eduRel.target;
					if (!education) continue;
					const schoolRels = await education.findRelationships({
						alias: "School",
					});
					const schoolData =
						schoolRels.length > 0
							? schoolRels[0].target.dataValues
							: null;
					educationData.push({
						...education.dataValues,
						school: schoolData,
					});
				}

				return toUserProfileDTO(
					user.dataValues,
					industryData as IndustryProperties[],
					skillData as SkillProperties[],
					educationData as any[],
				);
			}),
		);

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

export const updateBasicProfile = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const data: UpdateUserProfileSchema = req.body;
		const userId = req.user!.userId;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) throw new NotFoundError("User not found");

		Object.assign(user, data);
		await user.save();

		const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const updateUserSkills = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { skillIds }: UpdateUserSkillsSchema = req.body;
		const userId = req.user!.userId;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) throw new NotFoundError("User not found");

		await updateRelations(user, "Skill", skillIds, SkillModel, "skillId");

		const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Skills updated successfully",
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const updateUserIndustries = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { industryIds }: UpdateUserIndustriesSchema = req.body;
		const userId = req.user!.userId;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) throw new NotFoundError("User not found");

		await updateRelations(
			user,
			"Industry",
			industryIds,
			IndustryModel,
			"industryId",
		);

		const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Industries updated successfully",
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const getMe = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const userProfile = await getFullUserProfile(userId);

		res.status(200).json({
			success: true,
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const changeMyPassword = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { currentPassword, newPassword }: ChangePasswordSchema = req.body;
		const userId = req.user!.userId;

		const user = await UserModel.findOne({
			where: { userId },
		});

		if (!user) {
			throw new NotFoundError("User not found");
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);

		if (!isMatch) {
			throw new UnauthorizedError("Incorrect current password");
		}

		const newHashedPassword = await bcrypt.hash(newPassword, 12);

		user.password = newHashedPassword;
		user.updatedAt = new Date().toISOString();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const deleteMe = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundError("User not found");
		}

		await user.delete({
			detach: true,
		});

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
			data: null,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getAllUsers,
	getMe,
	deleteMe,
	updateBasicProfile,
	updateUserSkills,
	updateUserIndustries,
	changeMyPassword,
};
