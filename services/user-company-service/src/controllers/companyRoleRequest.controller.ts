import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils/appError";
import { CompanyModel, UserModel } from "../models";
import { CompanyRoleRequestStatus } from "../models/company.model";
import { database } from "../config/database";
import { toUserBasicDTO } from "../validators/user.validator";
import { OwnerCompanyRequest } from "../types";

const addAdminToCompany = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { email } = req.body;
		const { company } = req;

		if (!company) {
			throw new BadRequestError("Company not found in request context");
		}

		const newAdmin = await UserModel.findOne({
			where: {
				email,
			},
		});
		if (!newAdmin) {
			throw new BadRequestError("User not found");
		}

		const newAdminId = newAdmin.dataValues.userId;
		const companyId = company.dataValues.companyId;
		const neogma = database.getNeogma();

		const existingAdminCheck = await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c:Company)
			WHERE r.status = $status
			RETURN c.companyId as companyId
			LIMIT 1
			`,
			{
				userId: newAdminId,
				status: CompanyRoleRequestStatus.APPROVED,
			},
		);

		if (existingAdminCheck.records.length > 0) {
			const existingCompanyId =
				existingAdminCheck.records[0].get("companyId");
			if (existingCompanyId === companyId) {
				throw new BadRequestError(
					"User is already an admin of this company",
				);
			}
			throw new BadRequestError(
				`User is already an admin of another company`,
			);
		}

		const addAdminResult = await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})
			MATCH (c:Company {companyId: $companyId})
			MERGE (u)-[r:REQUESTS_COMPANY_ROLE]->(c)
			SET r.status = $status, r.requestedAt = $requestedAt
			RETURN u.userId as userId, c.companyId as companyId, u.name as userName, u.email as userEmail
			`,
			{
				userId: newAdminId,
				companyId,
				status: CompanyRoleRequestStatus.APPROVED,
				requestedAt: new Date().toISOString(),
			},
		);

		if (addAdminResult.records.length === 0) {
			throw new BadRequestError("Failed to add admin to company");
		}

		const record = addAdminResult.records[0];
		res.status(200).json({
			status: "success",
			message: "User added!",
			data: {
				admin: {
					id: record.get("userId"),
					name: record.get("userName"),
					email: record.get("userEmail"),
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

const viewAllCurrentAdmins = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id: companyId } = req.params;
		const { company } = req;
		if (!company) {
			throw new BadRequestError("Company not found in request context");
		}

		const admins = await CompanyModel.findRelationships({
			alias: "CompanyRoleRequest",
			where: {
				source: {
					companyId,
				},
				target: {},
				relationship: {
					status: CompanyRoleRequestStatus.APPROVED,
				},
			},
		});
		const data = admins.map((item) => {
			return {
				id: item.target.dataValues.userId,
				name: item.target.dataValues.name,
				email: item.target.dataValues.email,
			};
		});
		res.status(200).json({
			status: "success",
			data: {
				admins: data,
			},
		});
	} catch (error) {
		next(error);
	}
};

const removeAdminFromCompany = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { userId } = req.params;
		const { company } = req;
		if (!company) {
			throw new BadRequestError("Company not found in request context");
		}

		const removeAdminResult = await CompanyModel.deleteRelationships({
			alias: "CompanyRoleRequest",
			where: {
				source: {
					companyId: company.dataValues.companyId,
				},
				target: {
					userId,
				},
			},
		});
		if (!removeAdminResult) {
			throw new BadRequestError("Failed to remove admin from company");
		}

		res.status(200).json({
			status: "success",
			message: "Admin removed!",
		});
	} catch (error) {
		next(error);
	}
};

const viewAllRequests = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { company } = req;
		if (!company) {
			throw new BadRequestError("Company not found in request context");
		}

		const requests = await CompanyModel.findRelationships({
			alias: "CompanyRoleRequest",
		});
		const data = requests.map((item) => {
			return {
				status: item.relationship.status,
				requestedAt: item.relationship.requestedAt,
				user: toUserBasicDTO(item.target.dataValues),
			};
		});
		res.status(200).json({
			status: "success",
			data: {
				requests: data,
			},
		});
	} catch (error) {
		next(error);
	}
};

export default {
	addAdminToCompany,
	viewAllCurrentAdmins,
	removeAdminFromCompany,
	viewAllRequests,
};
