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

		const [ownerRelationship, industryRelationship] = await Promise.all([
			company.findRelationships({ alias: "Owner" }),
			company.findRelationships({ alias: "Industry" }),
		]);
		const companyProfile = toCompanyProfileDTO(
			company.dataValues,
			extractRelationshipData(ownerRelationship),
			extractRelationshipData(industryRelationship),
		);

		res.status(200).json({
			status: "success",
			data: {
				...companyProfile,
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

		// Handle industry relationship update
		if (data.industryId) {
			const industry = await IndustryModel.findOne({
				where: {
					industryId: data.industryId,
				},
			});
			if (!industry) {
				throw new BadRequestError("Industry does not exist");
			}

			const neogma = database.getNeogma();
			await neogma.queryRunner.run(
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

		const result = await CompanyModel.update(
			{
				...companyUpdateData,
			},
			{
				where: {
					companyId,
				},
				return: true,
			},
		);
		const companyProfile = toCompanyProfileDTO(result[0][0].dataValues);

		res.status(200).json({
			status: "success",
			message: "Company updated successfully",
			data: companyProfile,
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

export default {
	createCompany,
	getAllCompanies,
	getCompanyById,
	updateCompany,
	deleteCompany,
};
