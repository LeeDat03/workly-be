import z from "zod";
import {
	getUserModel,
	UserProperties,
	UserInstance,
} from "../models/user.model";
import { createUserSchema } from "../validators/user.validator";

// Helper function to remove undefined values from an object
const removeUndefinedProperties = <T extends Record<string, any>>(
	obj: T,
): Partial<T> => {
	return Object.fromEntries(
		Object.entries(obj).filter(([_, value]) => value !== undefined),
	) as Partial<T>;
};

const createUser = async (
	userData: z.infer<typeof createUserSchema>,
): Promise<UserInstance> => {
	const UserModel = getUserModel();

	const now = new Date().toISOString();
	const userProperties: any = {
		userId: userData.userId,
		email: userData.email,
		password: userData.password,
		name: userData.name,
		...(userData.bio && { bio: userData.bio }),
		...(userData.headline && { headline: userData.headline }),
		...(userData.avartarUrl && { avartarUrl: userData.avartarUrl }),
		...(userData.bgCoverUrl && { bgCoverUrl: userData.bgCoverUrl }),
		...(userData.dateOfBirth && {
			dateOfBirth: new Date(userData.dateOfBirth).toISOString(),
		}),
		role: userData.role || "USER",
		createdAt: now,
		updatedAt: now,
	};

	console.log("User properties before create:", userProperties);
	const user = await UserModel.createOne(userProperties);
	return user;
};

export default {
	createUser,
};
