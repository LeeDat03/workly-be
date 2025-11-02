import { NextFunction, Request, Response } from "express";
import { CompanyModel, IndustryModel } from "../models";
import { CompanyProperties } from "../models/company.model";
import {
	CreateCompanySchema,
	toCompanyProfileDTO,
	UpdateCompanySchema,
} from "../validators";
import { BadRequestError, NotFoundError } from "../utils/appError";
import { Op } from "neogma";

const extractRelationshipData = (relationships: any[]) => {
	return relationships[0]?.target?.dataValues || null;
};

const createCompany = async (
	req: Request,
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
							// TODO: get user from jwt
							email: "user3@gmail.com",
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
	req: Request,
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

		const result = await CompanyModel.update(
			{
				...data,
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
