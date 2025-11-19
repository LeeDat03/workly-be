import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { UserRole } from "../models/user.model";

export interface JwtPayload {
	id: string;
	iat: number;
	exp: number;
}

export const generateToken = (userId: string, role: UserRole): string => {
	const options: SignOptions = {
		expiresIn: config.jwt
			.expiresIn as unknown as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId, role }, config.jwt.secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
