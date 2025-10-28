import { Neogma } from "neogma";
import { getUserModel } from "./user.model";
import { getIndustryModel } from "./industry.model";
import { getCompanyModel } from "./company.model";
import { logger } from "../utils";

let UserModel: ReturnType<typeof getUserModel>;
let IndustryModel: ReturnType<typeof getIndustryModel>;
let CompanyModel: ReturnType<typeof getCompanyModel>;

export const initModels = async (neogma: Neogma) => {
	if (UserModel) {
		console.warn("Models already initialized");
		return;
	}

	UserModel = await getUserModel(neogma);
	IndustryModel = await getIndustryModel(neogma);
	CompanyModel = await getCompanyModel(neogma);

	logger.info("Models initialized");
};

export { UserModel, IndustryModel, CompanyModel };
