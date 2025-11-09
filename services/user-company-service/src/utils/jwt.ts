import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
	id: string;
	iat: number;
	exp: number;
}

export const generateToken = (userId: string): string => {
	const options: SignOptions = {
		expiresIn: config.jwt
			.expiresIn as unknown as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId }, config.jwt.secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
