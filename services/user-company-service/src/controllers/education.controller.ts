import { Request, Response, NextFunction } from "express";
import {
	CreateEducationSchema,
	UpdateEducationSchema,
} from "../validators/education.validator";
import { EducationModel, SchoolModel, UserModel } from "../models";
import { LoggedInUserRequest } from "../types";
import { BadRequestError, NotFoundError } from "../utils/appError";
import { database } from "../config/database";
import { nanoid } from "nanoid";

export const getAllMyEducations = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const user = await UserModel.findOne({ where: { userId } });
		if (!user) throw new NotFoundError("User not found");

		const educationData = [];
		const educationRels = await user.findRelationships({
			alias: "Education",
		});

		for (const eduRel of educationRels) {
			const education = eduRel.target;
			if (!education) continue;

			const schoolRels = await education.findRelationships({
				alias: "School",
			});
			const schoolData =
				schoolRels.length > 0 ? schoolRels[0].target.dataValues : null;

			educationData.push({
				...education.dataValues,
				school: schoolData,
			});
		}

		res.status(200).json({
			success: true,
			data: educationData,
		});
	} catch (error) {
		next(error);
	}
};

export const createEducation = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const data: CreateEducationSchema = req.body;
		const { schoolId, ...educationFields } = data;

		const school = await SchoolModel.findOne({ where: { schoolId } });
		if (!school) {
			throw new BadRequestError("School not found");
		}

		const neogma = database.getNeogma();
		const result = await neogma.queryRunner.run(
			`
            MATCH (u:User {userId: $userId})
            MATCH (s:School {schoolId: $schoolId})
            
            CREATE (e:Education {
                educationId: $educationId,
                degree: $degree,
                major: $major,
                start_date: $start_date,
                end_date: $end_date,
                description: $description
            })
            
            MERGE (u)-[:HAS_EDUCATION]->(e)
            MERGE (e)-[:ATTENDED_SCHOOL]->(s)
            
            RETURN e
            `,
			{
				userId,
				schoolId,
				educationId: nanoid(12),
				degree: educationFields.degree,
				major: educationFields.major,
				start_date: educationFields.start_date,
				end_date: educationFields.end_date || null,
				description: educationFields.description || null,
			},
		);

		const newEducation = result.records[0]?.get("e").properties;

		res.status(201).json({
			success: true,
			message: "Education created successfully",
			data: {
				...newEducation,
				school: school.dataValues,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const updateEducation = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const { educationId } = req.params;
		const data: UpdateEducationSchema = req.body;

		const user = await UserModel.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundError("User not found");
		}

		const rels = await user.findRelationships({
			alias: "Education",
			where: {
				target: { educationId },
				relationship: {},
			},
		});

		if (rels.length === 0) {
			throw new NotFoundError(
				"Education record not found or you don't own it",
			);
		}

		const education = rels[0].target;

		const { schoolId, ...educationFields } = data;
		Object.assign(education, educationFields);
		await education.save();

		if (
			data.schoolId &&
			data.schoolId !==
				(await education.findRelationships({ alias: "School" }))[0]
					?.target.dataValues.schoolId
		) {
			const school = await SchoolModel.findOne({
				where: { schoolId: data.schoolId },
			});
			if (!school) throw new BadRequestError("New school not found");

			const neogma = database.getNeogma();
			await neogma.queryRunner.run(
				`MATCH (e:Education {educationId: $educationId})-[r:ATTENDED_SCHOOL]->()
                 DELETE r`,
				{ educationId },
			);
			await neogma.queryRunner.run(
				`MATCH (e:Education {educationId: $educationId})
                 MATCH (s:School {schoolId: $schoolId})
                 MERGE (e)-[:ATTENDED_SCHOOL]->(s)`,
				{ educationId, schoolId: data.schoolId },
			);
		}

		const schoolRels = await education.findRelationships({
			alias: "School",
		});
		const schoolData =
			schoolRels.length > 0 ? schoolRels[0].target.dataValues : null;

		const finalEducationData = {
			...education.dataValues,
			school: schoolData,
		};

		res.status(200).json({
			success: true,
			message: "Education updated successfully",
			data: finalEducationData,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteEducation = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = req.user!.userId;
		const { educationId } = req.params;

		const user = await UserModel.findOne({ where: { userId } });
		const rels = await user!.findRelationships({
			alias: "Education",
			where: { target: { educationId }, relationship: {} },
		});

		if (rels.length === 0) {
			throw new NotFoundError(
				"Education record not found or you don't own it",
			);
		}

		const education = rels[0].target;

		await education.delete({ detach: true });

		res.status(200).json({
			success: true,
			message: "Education deleted successfully",
			data: null,
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getAllMyEducations,
	createEducation,
	updateEducation,
	deleteEducation,
};
