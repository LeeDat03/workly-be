import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import {
	UpdateUserProfileSchema,
	UpdateUserSkillsSchema,
	UpdateUserIndustriesSchema,
	UpdateUserLocationSchema,
	ChangePasswordSchema,
} from "../validators";
import { UserModel, SkillModel, SchoolModel, IndustryModel } from "../models";
import { Op } from "neogma";
import { LoggedInUserRequest } from "../types";
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "../utils/appError";
import {
	getUserProfile,
	updateRelationsWithQuery,
} from "../services/user.service";
import {
	toUserFollowDTO,
	UpdateEducationSchema,
	UpdateWorkExperienceSchema,
} from "../validators/user.validator";
import {
	checkIfUserFollowsUser,
	countUserFollowers,
	followUser,
	getUserFollowers,
	getUserFollowing,
	unfollowUser,
} from "../services/follow.service";
import { parsePaginationQuery } from "../utils/pagination";
import { clearCookie } from "./auth.controller";
import { cloudinaryService } from "../services/upload/cloudinary.service";
import { UNLISTED_COMPANY, UNLISTED_SCHOOL } from "../utils/constants";

// TODO: HANDLE TRANSACTION
const updateUserImage = async (
	userId: string,
	file: Express.Multer.File,
	type: "avatar" | "background",
) => {
	const { url } = await cloudinaryService.upload({
		file,
		sourceId: userId,
		fileType: type,
		overwrite: true,
	});

	const result = await UserModel.update(
		{
			[type === "avatar" ? "avatarUrl" : "bgCoverUrl"]: url,
		},
		{
			where: { userId },
			return: true,
		},
	);

	return result[0][0].dataValues;
};

// TODO: optimize
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

		res.status(200).json({
			success: true,
			data: users,
			pagination: {
				page,
				limit,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getUsersByIds = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { userIds } = req.body as { userIds?: string[] };

		if (!Array.isArray(userIds) || userIds.length === 0) {
			throw new BadRequestError("userIds must be a non-empty array");
		}

		const users = await UserModel.findMany({
			where: {
				userId: {
					[Op.in]: userIds,
				},
			},
			plain: true,
		});

		const userInfos = users.map((user) => {
			return toUserFollowDTO(user);
		});

		res.status(200).json({
			success: true,
			data: userInfos,
		});
	} catch (error) {
		next(error);
	}
};

export const getUserById = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const includeFields = req.query.include as string | undefined;
		const relationsArray = includeFields
			? includeFields.trim().split(",")
			: [];

		if (!id) {
			throw new BadRequestError("User ID is required");
		}

		const [userProfile, followersCount] = await Promise.all([
			getUserProfile(id, relationsArray),
			countUserFollowers(id),
		]);
		userProfile.user.followersCount = followersCount;

		res.status(200).json({
			success: true,
			data: userProfile,
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

		// const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			// data: userProfile,
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

		await updateRelationsWithQuery(
			userId,
			"HAS_SKILL",
			"Skill",
			"skillId",
			skillIds,
		);

		// const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Skills updated successfully",
			// data: userProfile,
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

		await updateRelationsWithQuery(
			userId,
			"IN_INDUSTRY",
			"Industry",
			"industryId",
			industryIds,
		);

		// const userProfile = await getFullUserProfile(userId);
		res.status(200).json({
			success: true,
			message: "Industries updated successfully",
			// data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const updateUserLocation = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { locationId }: UpdateUserLocationSchema = req.body;
		const userId = req.user!.userId;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) throw new NotFoundError("User not found");

		if (locationId) {
			await updateRelationsWithQuery(
				userId,
				"LOCATED_IN",
				"Location",
				"locationId",
				[locationId],
			);
		} else {
			// If locationId is null or empty, remove the location relationship
			await updateRelationsWithQuery(
				userId,
				"LOCATED_IN",
				"Location",
				"locationId",
				[],
			);
		}

		res.status(200).json({
			success: true,
			message: "Location updated successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const updateUserEducations = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const educationsData: UpdateEducationSchema = req.body;
		const user = await UserModel.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundError("User not found");
		}

		const unlistedSchools = educationsData.filter(
			(e) => e.schoolId === UNLISTED_SCHOOL.schoolId,
		);
		const missingSchoolName = unlistedSchools.some(
			(e) => !e.schoolName || e.schoolName.trim() === "",
		);
		if (missingSchoolName) {
			throw new BadRequestError(
				"School name is required for unlisted schools",
			);
		}

		await updateRelationsWithQuery(
			userId,
			"ATTEND_SCHOOL",
			"School",
			"schoolId",
			educationsData.map((e) => e.schoolId),
			educationsData.map((e) => {
				// get every property except schoolId
				const { schoolId, ...rest } = e;
				return rest;
			}),
		);

		res.status(200).json({
			success: true,
			message: "Education updated successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const updateUserWorkExperiences = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const workExperiencesData: UpdateWorkExperienceSchema = req.body;
		const user = await UserModel.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundError("User not found");
		}

		// Validate for UNLISTED companies
		const unlistedCompanies = workExperiencesData.filter(
			(e) => e.companyId === UNLISTED_COMPANY.companyId,
		);
		const missingCompanyName = unlistedCompanies.some(
			(e) => !e.companyName || e.companyName.trim() === "",
		);

		console.log(unlistedCompanies, missingCompanyName);
		if (missingCompanyName) {
			throw new BadRequestError(
				"Company name is required for unlisted companies",
			);
		}

		await updateRelationsWithQuery(
			userId,
			"WORKS_AT",
			"Company",
			"companyId",
			workExperiencesData.map((e) => e.companyId),
			workExperiencesData.map((e) => {
				const { companyId, ...rest } = e;
				return rest;
			}),
		);
		res.status(200).json({
			success: true,
			message: "Work experiences updated successfully",
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
		const includeFields = req.query.include as string | undefined;
		const relationsArray = includeFields
			? includeFields.trim().split(",")
			: [];
		const userProfile = await getUserProfile(userId, relationsArray);
		res.status(200).json({
			success: true,
			data: userProfile,
		});
	} catch (error) {
		next(error);
	}
};

export const getAllSkills = async (
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

		const rawSkills = await SkillModel.findMany({
			where: whereCondition,
			limit: limit,
			skip: skip,
			order: [["name", "ASC"]],
		});

		const cleanSkills = rawSkills.map((skill: any) => skill.dataValues);

		res.status(200).json({
			success: true,
			message: "Skills retrieved successfully",
			data: cleanSkills,
			pagination: {
				page,
				limit,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getAllIndustries = async (
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

		const rawIndustries = await IndustryModel.findMany({
			where: whereCondition,
			limit: limit,
			skip: skip,
			order: [["name", "ASC"]],
		});

		const cleanIndustries = rawIndustries.map(
			(industry: any) => industry.dataValues,
		);

		res.status(200).json({
			success: true,
			message: "Industries retrieved successfully",
			data: cleanIndustries,
			pagination: {
				page,
				limit,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getAllSchools = async (
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

		const rawSchools = await SchoolModel.findMany({
			where: whereCondition,
			limit: limit,
			skip: skip,
			order: [["name", "ASC"]],
		});

		const cleanSchools = rawSchools.map((school: any) => school.dataValues);

		res.status(200).json({
			success: true,
			message: "Skills retrieved successfully",
			data: cleanSchools,
			pagination: {
				page,
				limit,
			},
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

		clearCookie(res);

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
			data: null,
		});
	} catch (error) {
		next(error);
	}
};

const updateUserMedia = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const updates: {
			avatar?: Express.Multer.File;
			background?: Express.Multer.File;
		} = {};

		if (req.files && !Array.isArray(req.files)) {
			if (req.files.avatar && Array.isArray(req.files.avatar)) {
				updates.avatar = req.files.avatar[0];
			}
			if (req.files.background && Array.isArray(req.files.background)) {
				updates.background = req.files.background[0];
			}
		}

		if (!updates.avatar && !updates.background) {
			throw new BadRequestError("Avatar or background is required");
		}

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundError("User not found");
		}

		const updatePromises = [];
		if (updates.avatar) {
			updatePromises.push(
				updateUserImage(userId, updates.avatar, "avatar"),
			);
		}
		if (updates.background) {
			updatePromises.push(
				updateUserImage(userId, updates.background, "background"),
			);
		}

		const updateResults = await Promise.all(updatePromises);
		const finalResult = updateResults[updateResults.length - 1];

		const messages = [];
		if (updates.avatar) messages.push("avatar");
		if (updates.background) messages.push("background");

		res.status(200).json({
			success: true,
			message: `User ${messages.join(" and ")} updated successfully`,
			data: {
				user: finalResult,
			},
		});
	} catch (error) {
		next(error);
	}
};

const follow = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const { id: targetId } = req.params;
		if (!targetId) {
			throw new BadRequestError("Target ID is required");
		}
		if (userId === targetId) {
			throw new BadRequestError("You cannot follow yourself");
		}

		await followUser(userId, targetId);

		res.status(200).json({
			success: true,
			message: "Followed successfully",
		});
	} catch (error) {
		next(error);
	}
};

const unfollow = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const { id: targetId } = req.params;
		if (!targetId) {
			throw new BadRequestError("Target ID is required");
		}
		if (userId === targetId) {
			throw new BadRequestError("You cannot unfollow yourself");
		}

		await unfollowUser(userId, targetId);

		res.status(200).json({
			success: true,
			message: "Unfollowed successfully",
		});
	} catch (error) {
		next(error);
	}
};

const getFollowers = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const paginationQuery = parsePaginationQuery(req.query);

		if (!id) {
			throw new BadRequestError("User ID is required");
		}
		const { followers, pagination } = await getUserFollowers(
			id,
			paginationQuery,
		);
		res.status(200).json({
			success: true,
			data: {
				followers,
				pagination,
			},
		});
	} catch (error) {
		next(error);
	}
};

const getFollowing = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = req.params;
		const paginationQuery = parsePaginationQuery(req.query);
		if (!id) {
			throw new BadRequestError("User ID is required");
		}
		const { following, pagination } = await getUserFollowing(
			id,
			paginationQuery,
		);
		res.status(200).json({
			success: true,
			data: {
				following,
				pagination,
			},
		});
	} catch (error) {
		next(error);
	}
};

const isFollowing = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const user = (req as any).user;
		if (!user || !user.userId || user.userId === id) {
			return res.status(200).json({
				success: true,
				data: {
					isFollowing: false,
				},
			});
		}

		const isFollowingUser = await checkIfUserFollowsUser(user.userId, id);
		res.status(200).json({
			success: true,
			data: {
				isFollowing: isFollowingUser,
			},
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getAllUsers,
	getUsersByIds,
	getUserById,
	getMe,
	deleteMe,
	updateBasicProfile,
	getAllSkills,
	getAllIndustries,
	getAllSchools,
	updateUserSkills,
	updateUserIndustries,
	updateUserLocation,
	updateUserEducations,
	updateUserWorkExperiences,
	changeMyPassword,
	follow,
	unfollow,
	getFollowers,
	getFollowing,
	updateUserMedia,
	isFollowing,
};
