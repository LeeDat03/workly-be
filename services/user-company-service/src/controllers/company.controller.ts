import { NextFunction, Request, Response } from "express";
import { CompanyModel, IndustryModel } from "../models";
import {
	CompanyProperties,
	CompanyRoleRequestStatus,
} from "../models/company.model";
import {
	CreateCompanySchema,
	toCompanyProfileDTO,
	UpdateCompanySchema,
} from "../validators";
import { Op } from "neogma";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../utils/appError";
import { LoggedInUserRequest } from "../types";
import { database } from "../config/database";
import { cloudinaryService } from "../services/upload/cloudinary.service";
import {
	checkIfUserFollowsCompany,
	countCompanyFollowers,
	followCompany,
	getCompanyFollowers,
	unfollowCompany,
} from "../services/follow.service";
import { parsePaginationQuery } from "../utils/pagination";

const extractRelationshipData = (relationships: any[]) => {
	return relationships[0]?.target?.dataValues || null;
};

const checkCompanyAccess = async (userId: string, companyId: string) => {
	const neogma = database.getNeogma();

	const result = await neogma.queryRunner.run(
		`
		MATCH (c:Company {companyId: $companyId})
		OPTIONAL MATCH (owner:User {userId: $userId})-[:OWNS]->(c)
		OPTIONAL MATCH (admin:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c)
		RETURN 
			owner IS NOT NULL as isOwner,
			(r IS NOT NULL AND r.status = $approvedStatus) as isAdmin
		LIMIT 1
		`,
		{
			companyId,
			userId,
			approvedStatus: CompanyRoleRequestStatus.APPROVED,
		},
	);

	if (result.records.length === 0) {
		return { isOwner: false, isAdmin: false };
	}

	const record = result.records[0];
	return {
		isOwner: record.get("isOwner") || false,
		isAdmin: record.get("isAdmin") || false,
	};
};

// TODO: HANDLE TRANSACTION
const updateCompanyImage = async (
	companyId: string,
	file: Express.Multer.File,
	type: "logo" | "banner",
) => {
	const { url } = await cloudinaryService.upload({
		file,
		sourceId: companyId,
		fileType: type,
		overwrite: true,
	});

	const result = await CompanyModel.update(
		{
			[type === "logo" ? "logoUrl" : "bannerUrl"]: url,
		},
		{
			where: {
				companyId,
			},
			return: true,
		},
	);

	return result[0][0].dataValues;
};

const createCompany = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const data: CreateCompanySchema = req.body;

		const existCompany = await CompanyModel.findOne({
			where: {
				name: data.name,
			},
		});
		if (existCompany) {
			throw new BadRequestError("Company with this name already exist");
		}

		const industry = await IndustryModel.findOne({
			where: {
				industryId: data.industryId,
			},
		});
		if (!industry) {
			throw new BadRequestError("Industry does not exist");
		}

		const newCompany = await CompanyModel.createOne(
			{
				...data,
				// Relationship
				Industry: {
					// Enable merge => not create new node if it already exists
					propertiesMergeConfig: {
						nodes: true,
						relationship: true,
					},
					where: {
						merge: true,
						// Params to match the node
						params: {
							industryId: data.industryId,
						},
					},
				},
				Owner: {
					propertiesMergeConfig: {
						nodes: true,
						relationship: true,
					},
					where: {
						merge: true,
						params: {
							userId: req.user!.userId,
						},
					},
				},
			} as unknown as CompanyProperties,
			{ merge: true },
		);
		const companyProfile = toCompanyProfileDTO(newCompany.dataValues);

		res.status(200).json({
			status: "success",
			message: "Company created successfully",
			data: companyProfile,
		});
	} catch (error) {
		next(error);
	}
};

// TODO: CUSTOMIZE FOR EACH USER
const getAllCompanies = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Math.min(Number(req.query.limit) || 20, 20);
		const offset = (page - 1) * limit;
		const search = String(req.query.search || "");

		const companies = await CompanyModel.findMany({
			where: {
				name: {
					[Op.contains]: search,
				},
			},
			limit,
			skip: offset,
			plain: true,
		});

		res.status(200).json({
			status: "success",
			data: companies,
		});
	} catch (error) {
		next(error);
	}
};

const getCompanyById = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id: companyId } = req.params;
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}

		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}

		const [ownerRelationship, industryRelationship, followersCount] =
			await Promise.all([
				company.findRelationships({ alias: "Owner" }),
				company.findRelationships({ alias: "Industry" }),
				countCompanyFollowers(companyId),
			]);

		const companyProfile = {
			...toCompanyProfileDTO(
				company.dataValues,
				extractRelationshipData(ownerRelationship),
				extractRelationshipData(industryRelationship),
			),
		};

		res.status(200).json({
			status: "success",
			data: {
				company: {
					...companyProfile.company,
					followersCount,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

const updateCompany = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id: companyId } = req.params;
		const data: UpdateCompanySchema = req.body;
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}
		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}

		const { isOwner, isAdmin } = await checkCompanyAccess(
			req.user!.userId,
			companyId,
		);
		if (!isOwner && !isAdmin) {
			throw new ForbiddenError(
				"You must be the owner or an admin of this company to perform this action",
			);
		}

		if (data.name && data.name !== company.name) {
			const existCompany = await CompanyModel.findOne({
				where: {
					name: data.name,
				},
			});
			if (existCompany) {
				throw new BadRequestError(
					"Company with this name already exist",
				);
			}
		}

		const neogma = database.getNeogma();
		const session = neogma.driver.session();
		const transaction = session.beginTransaction();

		try {
			if (data.industryId) {
				const industry = await IndustryModel.findOne({
					where: {
						industryId: data.industryId,
					},
				});
				if (!industry) {
					throw new BadRequestError("Industry does not exist");
				}

				await transaction.run(
					`
					MATCH (c:Company {companyId: $companyId})
					OPTIONAL MATCH (c)-[r:IN]->(:Industry)
					DELETE r
					WITH c
					MATCH (i:Industry {industryId: $industryId})
					MERGE (c)-[:IN]->(i)
					`,
					{
						companyId,
						industryId: data.industryId,
					},
				);
			}

			const { industryId, ...companyUpdateData } = data;

			// Update company properties
			const updateResult = await transaction.run(
				`
				MATCH (c:Company {companyId: $companyId})
				SET c += $updateData
				RETURN c
				`,
				{
					companyId,
					updateData: companyUpdateData,
				},
			);

			if (updateResult.records.length === 0) {
				throw new NotFoundError("Company not found during update");
			}

			await transaction.commit();

			// const result = await CompanyModel.findOne({
			// 	where: {
			// 		companyId,
			// 	},
			// });

			// if (!result) {
			// 	throw new NotFoundError("Company not found after update");
			// }

			// const companyProfile = toCompanyProfileDTO(result.dataValues);

			res.status(200).json({
				status: "success",
				message: "Company updated successfully",
				// data: companyProfile,
			});
		} catch (error) {
			await transaction.rollback();
			throw error;
		} finally {
			await session.close();
		}

		return;
	} catch (error) {
		next(error);
	}
};

const updateCompanyMedia = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id: companyId } = req.params;
		const updates: {
			logo?: Express.Multer.File;
			banner?: Express.Multer.File;
		} = {};

		if (req.files && !Array.isArray(req.files)) {
			if (req.files.logo && Array.isArray(req.files.logo)) {
				updates.logo = req.files.logo[0];
			}
			if (req.files.banner && Array.isArray(req.files.banner)) {
				updates.banner = req.files.banner[0];
			}
		}

		if (!updates.logo && !updates.banner) {
			throw new BadRequestError("Logo or banner is required");
		}

		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}

		const { isOwner, isAdmin } = await checkCompanyAccess(
			req.user!.userId,
			companyId,
		);
		if (!isOwner && !isAdmin) {
			throw new ForbiddenError(
				"You must be the owner or an admin of this company to perform this action",
			);
		}

		const updatePromises = [];
		if (updates.logo) {
			updatePromises.push(
				updateCompanyImage(companyId, updates.logo, "logo"),
			);
		}
		if (updates.banner) {
			updatePromises.push(
				updateCompanyImage(companyId, updates.banner, "banner"),
			);
		}

		const updateResults = await Promise.all(updatePromises);
		const finalResult = updateResults[updateResults.length - 1];

		const messages = [];
		if (updates.logo) messages.push("logo");
		if (updates.banner) messages.push("banner");

		return res.status(200).json({
			status: "success",
			message: `Company ${messages.join(" and ")} updated successfully`,
			data: {
				company: finalResult,
			},
		});
	} catch (error) {
		next(error);
	}
};

const deleteCompany = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id: companyId } = req.params;
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}

		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}
		await company.delete({
			detach: true,
		});

		return res.status(200).json({
			status: "success",
			data: {
				message: "Company deleted successfully",
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

		await followCompany(userId, targetId);

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

		await unfollowCompany(userId, targetId);

		res.status(200).json({
			success: true,
			message: "Unfollowed successfully",
		});
	} catch (error) {
		next(error);
	}
};

const isFollowing = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id: companyId } = req.params;
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}

		const user = (req as any).user;
		if (!user || !user.userId) {
			return res.status(200).json({
				success: true,
				data: {
					isFollowing: false,
				},
			});
		}

		const isFollowingCompany = await checkIfUserFollowsCompany(
			user.userId,
			companyId,
		);

		res.status(200).json({
			success: true,
			data: {
				isFollowing: isFollowingCompany,
			},
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
		const { id: companyId } = req.params;
		const paginationQuery = parsePaginationQuery(req.query);
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}

		const { followers, pagination } = await getCompanyFollowers(
			companyId,
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

const getCompaniesByIds = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { companyIds } = req.body as { companyIds?: string[] };

		if (!Array.isArray(companyIds) || companyIds.length === 0) {
			throw new BadRequestError("companyId must be a non-empty array");
		}

		const companies = await CompanyModel.findMany({
			where: {
				companyId: {
					[Op.in]: companyIds,
				},
			},
			plain: true,
		});

		res.status(200).json({
			success: true,
			data: companies,
		});
	} catch (error) {
		next(error);
	}
};

const checkAccess = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id: companyId } = req.params;
		if (!companyId) {
			throw new BadRequestError("Company ID is required");
		}

		const user = (req as any).user;
		if (!user || !user.userId) {
			return res.status(200).json({
				success: true,
				data: {
					isAccess: false,
					message: "You must be logged in to check access",
				},
			});
		}

		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}

		const { isOwner, isAdmin } = await checkCompanyAccess(
			user.userId,
			companyId,
		);

		return res.status(200).json({
			success: true,
			data: {
				isAccess: isOwner || isAdmin,
			},
		});
	} catch (error) {
		next(error);
	}
};

export default {
	createCompany,
	getAllCompanies,
	getCompanyById,
	getCompaniesByIds,
	updateCompany,
	deleteCompany,
	updateCompanyMedia,
	follow,
	unfollow,
	isFollowing,
	getFollowers,
	checkAccess,
};
