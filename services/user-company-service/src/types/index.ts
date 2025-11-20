import { Request } from "express";
import { CompanyInstance } from "../models/company.model";
import { UserInstance, UserRole } from "../models/user.model";

export interface ApiError extends Error {
	statusCode?: number;
	isOperational?: boolean;
}

export interface ApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
}

interface LoggedInUserPayload {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
}

export interface LoggedInUserRequest extends Request {
	user?: LoggedInUserPayload;
}

export interface OwnerCompanyRequest extends LoggedInUserRequest {
	company?: CompanyInstance;
}

export interface IPagination {
	page: number;
	limit: number;
	search: string;
}
