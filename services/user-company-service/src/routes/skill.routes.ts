import { NextFunction, Request, Response, Router } from "express";
import { parsePaginationQuery } from "../utils/pagination";
import { database } from "../config/database";
import { int } from "neo4j-driver";
import { isAuthenticated } from "../middlewares";
import { BadRequestError } from "../utils/appError";
import { SkillModel } from "../models";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { page, limit, search } = parsePaginationQuery(req.query);
		const neogma = database.getNeogma();

		const offset = (page - 1) * limit;
		// Get extra record to check if there is more data
		const queryLimit = limit + 1;

		const query = search
			? `
				MATCH (u:Skill)
				WHERE toLower(u.name) CONTAINS toLower($search)
				RETURN u
				SKIP $offset
				LIMIT $queryLimit
			`
			: `
				MATCH (u:Skill)
				RETURN u
				SKIP $offset
				LIMIT $queryLimit
			`;

		const result = await neogma.queryRunner.run(query, {
			...(search && { search }),
			offset: int(offset),
			queryLimit: int(queryLimit),
		});

		const skills = result.records.map((record) => {
			const node = record.get("u");
			return node.properties;
		});

		const hasNextPage = skills.length > limit;
		const paginatedSkills = skills.slice(0, limit);

		res.status(200).json({
			success: true,
			data: paginatedSkills,
			pagination: {
				page,
				limit,
				hasNextPage,
			},
		});
	} catch (error) {
		next(error);
	}
});

router.post(
	"/",
	isAuthenticated,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name } = req.body;
			if (!name) {
				throw new BadRequestError("Name is required");
			}

			const normalizedName = name.trim().toLowerCase().replace(/ /g, "_");

			const currSkill = await SkillModel.findOne({
				where: {
					skillId: normalizedName,
				},
			});
			if (currSkill) {
				throw new BadRequestError(`Use ${currSkill.name} instead`);
			}

			const newSkill = await SkillModel.createOne({
				skillId: normalizedName,
				name: name,
			});

			res.status(201).json({
				success: true,
				message: "Skill created successfully",
				data: newSkill.dataValues,
			});
		} catch (error) {
			next(error);
		}
	},
);

export default router;
