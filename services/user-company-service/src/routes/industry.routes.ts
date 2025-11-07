import { NextFunction, Request, Response, Router } from "express";
import { IndustryModel } from "../models";
import { database } from "../config/database";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const search = String(req?.query?.search || "");

		const neogma = database.getNeogma();

		let industries;
		if (search) {
			const result = await neogma.queryRunner.run(
				`
				MATCH (u:Industry)
				WHERE toLower(u.name) CONTAINS toLower($search)
				RETURN u
				`,
				{ search },
			);

			industries = result.records.map((record) => {
				const node = record.get("u");
				return node.properties;
			});
		} else {
			industries = await IndustryModel.findMany({
				plain: true,
			});
		}

		res.status(200).json({
			success: true,
			data: industries,
		});
	} catch (error) {
		next(error);
	}
});

export default router;
