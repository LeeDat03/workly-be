import { Response, NextFunction } from "express";
import { CompanyModel } from "../models";
import {
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "../utils/appError";
import { OwnerCompanyRequest } from "../types";

export const checkCompanyOwner = async (
	req: OwnerCompanyRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		// TODO: Check if user is authenticated
		// if (!req.user || !req.user.userId) {
		// 	throw new UnauthorizedError("Authentication required");
		// }
		// const userId = req.user.userId;

		const userId = req.body.userId;
		const companyId = req.params.id;
		if (!companyId) {
			throw new NotFoundError("Company ID is required");
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

		const ownerRelationships = await company.findRelationships({
			alias: "Owner",
		});
		if (!ownerRelationships || ownerRelationships.length === 0) {
			throw new NotFoundError("Company owner not found");
		}

		const owner = ownerRelationships[0]?.target?.dataValues;
		if (!owner || owner.userId !== userId) {
			throw new ForbiddenError(
				"You do not have permission to perform this action. Only the company owner can access this resource.",
			);
		}

		next();
	} catch (error) {
		next(error);
	}
};
