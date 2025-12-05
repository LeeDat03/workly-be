import { Response, NextFunction } from "express";
import { CompanyModel } from "../models";
import {
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "../utils/appError";
import { OwnerCompanyRequest } from "../types";
import { database } from "../config/database";
import { CompanyRoleRequestStatus } from "../models/company.model";

export const isCompanyAdminOrSelf = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		if (!req.user || !req.user.userId) {
			throw new UnauthorizedError("Authentication required");
		}
		const userId = req.user.userId;
		const companyId = req.params.id;
		const targetUserId = req.params.userId;

		if (!companyId) {
			throw new NotFoundError("Company ID is required");
		}
		if (!targetUserId) {
			throw new NotFoundError("User ID is required");
		}

		const company = await CompanyModel.findOne({
			where: {
				companyId,
			},
		});
		if (!company) {
			throw new NotFoundError("Company not found");
		}

		req.company = company;

		const neogma = database.getNeogma();

		const ownerCheck = await neogma.queryRunner.run(
			`
			MATCH (c:Company {companyId: $companyId})-[:OWNS]-(owner:User {userId: $userId})
			RETURN owner.userId as ownerId
			`,
			{ companyId, userId },
		);

		if (ownerCheck.records.length > 0) {
			next();
			return;
		}

		if (userId === targetUserId) {
			const adminCheck = await neogma.queryRunner.run(
				`
				MATCH (u:User {userId: $userId})-[r:REQUESTS_COMPANY_ROLE]->(c:Company {companyId: $companyId})
				WHERE r.status = $status
				RETURN u.userId as adminId
				`,
				{
					userId,
					companyId,
					status: CompanyRoleRequestStatus.APPROVED,
				},
			);

			if (adminCheck.records.length > 0) {
				next();
				return;
			}
		}

		throw new ForbiddenError(
			"You do not have permission to perform this action. Only the company owner can remove other admins, or you can remove yourself.",
		);
	} catch (error) {
		next(error);
	}
};
