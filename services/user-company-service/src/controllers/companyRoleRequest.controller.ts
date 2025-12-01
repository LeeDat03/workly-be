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
		const { email, userId } = req.body;
		const { company } = req;

		if (!company) {
			throw new BadRequestError("Company not found in request context");
		}

		if (!email && !userId) {
			throw new BadRequestError("Either email or userId is required");
		}

		// Find user by email or userId
		let newAdmin;
		if (email) {
			newAdmin = await UserModel.findOne({
				where: { email },
			});
		} else {
			newAdmin = await UserModel.findOne({
				where: { userId },
			});
		}

		if (!newAdmin) {
			throw new BadRequestError("User not found");
		}

		const newAdminId = newAdmin.dataValues.userId;
		const companyId = company.dataValues.companyId;
		const neogma = database.getNeogma();

		// Check if user is already an admin of THIS specific company
		const existingAdminCheck = await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c:Company {companyId: $companyId})
			WHERE r.status = $status
			RETURN c.companyId as companyId
			`,
			{
				userId: newAdminId,
				companyId,
				status: CompanyRoleRequestStatus.APPROVED,
			},
		);

		if (existingAdminCheck.records.length > 0) {
			throw new BadRequestError(
				"User is already an admin of this company",
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

		const neogma = database.getNeogma();

		// Get OWNER first
		const ownerResult = await neogma.queryRunner.run(
			`
			MATCH (c:Company {companyId: $companyId})-[:OWNS]-(owner:User)
			RETURN owner.userId as userId,
				   owner.name as name,
				   owner.email as email,
				   owner.username as username,
				   owner.avatarUrl as avatarUrl,
				   'OWNER' as role
			`,
			{ companyId },
		);

		// Get ADMINs
		const adminsResult = await neogma.queryRunner.run(
			`
			MATCH (admin:User)-[r:REQUESTS_COMPANY_ROLE]->(c:Company {companyId: $companyId})
			WHERE r.status = $status
			RETURN admin.userId as userId,
				   admin.name as name,
				   admin.email as email,
				   admin.username as username,
				   admin.avatarUrl as avatarUrl,
				   'ADMIN' as role
			ORDER BY admin.name ASC
			`,
			{
				companyId,
				status: CompanyRoleRequestStatus.APPROVED,
			},
		);

		// Combine results: OWNER first, then ADMINs
		const ownerData = ownerResult.records.map((record) => ({
			userId: record.get("userId"),
			name: record.get("name"),
			email: record.get("email"),
			username: record.get("username"),
			avatarUrl: record.get("avatarUrl"),
			role: record.get("role"),
		}));

		const adminData = adminsResult.records.map((record) => ({
			userId: record.get("userId"),
			name: record.get("name"),
			email: record.get("email"),
			username: record.get("username"),
			avatarUrl: record.get("avatarUrl"),
			role: record.get("role"),
		}));

		const admins = [...ownerData, ...adminData];

		res.status(200).json({
			status: "success",
			data: {
				admins,
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

		const companyId = company.dataValues.companyId;
		const neogma = database.getNeogma();

		// First, check if the user exists
		const userCheck = await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})
			RETURN u.userId as userId
			`,
			{ userId },
		);

		if (userCheck.records.length === 0) {
			throw new BadRequestError("User not found");
		}

		// Check if the relationship exists
		const relationshipCheck = await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c:Company {companyId: $companyId})
			RETURN r, r.status as status
			`,
			{
				userId,
				companyId,
			},
		);

		if (relationshipCheck.records.length === 0) {
			throw new BadRequestError(
				"This user is not an admin of this company",
			);
		}

		const relStatus = relationshipCheck.records[0].get("status");
		if (relStatus !== CompanyRoleRequestStatus.APPROVED) {
			throw new BadRequestError(
				`Cannot remove admin: status is ${relStatus}`,
			);
		}

		// Delete the relationship
		await neogma.queryRunner.run(
			`
			MATCH (u:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c:Company {companyId: $companyId})
			WHERE r.status = $status
			DELETE r
			`,
			{
				userId,
				companyId,
				status: CompanyRoleRequestStatus.APPROVED,
			},
		);

		res.status(200).json({
			status: "success",
			message: "Admin removed successfully!",
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
