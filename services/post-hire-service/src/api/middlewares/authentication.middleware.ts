import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/common/enviroment";
import { APIError } from "@/common/error/api.error";
import axios from "axios";

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {

        let token;

        if (req.cookies.token) {
            token = req.cookies.token.trim();
        } else {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1].trim();
            }
        }

        if (!token) {
            throw new APIError({ message: "Token is required" });
        }

        const response = await axios.get(
            `http://localhost:8000/api/v1/auth/me`,
            {
                headers: {
                    Cookie: req.headers.cookie,
                    Authorization: req.headers.authorization
                },
                withCredentials: true,
            }
        );
        const { data } = response.data

        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        if (decoded.id != data.userId) {
            throw new APIError({ message: "userid invalid" })
        }

        req.user = {
            userId: data.userId,
            email: data.email,
            name: data.name,
            role: data.role,
        };

        next();
    } catch (error) {
        next(error);
    }
};
