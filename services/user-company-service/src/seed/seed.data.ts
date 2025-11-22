import { CompanySize } from "../models/company.model";
import { UNLISTED_SCHOOL } from "../utils/constants";

export const LOCATION_DATA = [
	{ locationId: "an_giang", name: "An Giang" },
	{ locationId: "bac_ninh", name: "Bac Ninh" },
	{ locationId: "cao_bang", name: "Cao Bang" },
	{ locationId: "ca_mau", name: "Ca Mau" },
	{ locationId: "gia_lai", name: "Gia Lai" },
	{ locationId: "ha_tinh", name: "Ha Tinh" },
	{ locationId: "hung_yen", name: "Hung Yen" },
	{ locationId: "khanh_hoa", name: "Khanh Hoa" },
	{ locationId: "lai_chau", name: "Lai Chau" },
	{ locationId: "lao_cai", name: "Lao Cai" },
	{ locationId: "lam_dong", name: "Lam Dong" },
	{ locationId: "lang_son", name: "Lang Son" },
	{ locationId: "nghe_an", name: "Nghe An" },
	{ locationId: "ninh_binh", name: "Ninh Binh" },
	{ locationId: "phu_tho", name: "Phu Tho" },
	{ locationId: "quang_ngai", name: "Quang Ngai" },
	{ locationId: "quang_ninh", name: "Quang Ninh" },
	{ locationId: "quang_tri", name: "Quang Tri" },
	{ locationId: "son_la", name: "Son La" },
	{ locationId: "thanh_hoa", name: "Thanh Hoa" },
	{ locationId: "can_tho", name: "Can Tho" },
	{ locationId: "hue", name: "Hue" },
	{ locationId: "ha_noi", name: "Ha Noi" },
	{ locationId: "hai_phong", name: "Hai Phong" },
	{ locationId: "ho_chi_minh", name: "Ho Chi Minh" },
	{ locationId: "da_nang", name: "Da Nang" },
	{ locationId: "thai_nguyen", name: "Thai Nguyen" },
	{ locationId: "tuyen_quang", name: "Tuyen Quang" },
	{ locationId: "tay_ninh", name: "Tay Ninh" },
	{ locationId: "vinh_long", name: "Vinh Long" },
	{ locationId: "dien_bien", name: "Dien Bien" },
	{ locationId: "dak_lak", name: "Dak Lak" },
	{ locationId: "dong_nai", name: "Dong Nai" },
	{ locationId: "dong_thap", name: "Dong Thap" },
];

export const INDUSTRY_DATA = [
	{ industryId: "telecommunications", name: "Telecommunications" },
	{ industryId: "electrical", name: "Electrical" },
	{ industryId: "technology", name: "Technology" },
	{ industryId: "iot", name: "IoT" },
	{ industryId: "automotive", name: "Automotive" },
	{ industryId: "business", name: "Business" },
	{ industryId: "marketing", name: "Marketing" },
	{ industryId: "accounting", name: "Accounting" },
	{ industryId: "finance", name: "Finance" },
	{ industryId: "healthcare", name: "Healthcare" },
	{ industryId: "education", name: "Education" },
];

export const SKILL_DATA = [
	{ skillId: "javascript", name: "JavaScript" },
	{ skillId: "python", name: "Python" },
	{ skillId: "react", name: "React" },
	{ skillId: "nodejs", name: "Node.js" },
	{ skillId: "mongodb", name: "MongoDB" },
	{ skillId: "express", name: "Express" },
	{ skillId: "java", name: "Java" },
	{ skillId: "c++", name: "C++" },
	{ skillId: "c#", name: "C#" },
	{ skillId: "php", name: "PHP" },
	{ skillId: "ruby", name: "Ruby" },
	{ skillId: "swift", name: "Swift" },
	{ skillId: "kotlin", name: "Kotlin" },
	{ skillId: "rust", name: "Rust" },
	{ skillId: "go", name: "Go" },
];

export const SCHOOL_DATA = [
	{
		schoolId: "ptit",
		name: "Posts and Telecommunications Institute of Technology",
	},
	{ schoolId: "hust", name: "Hanoi University of Science and Technology" },
	{ schoolId: "hcmut", name: "Ho Chi Minh City University of Technology" },
	{ schoolId: "uet", name: "VNU University of Engineering and Technology" },
	{ schoolId: "uit", name: "University of Information Technology" },
	{ schoolId: "fpt", name: "FPT University" },
	{
		schoolId: "hcmute",
		name: "HCMC University of Technology and Education",
	},
	{ schoolId: "rmit", name: "RMIT University Vietnam" },
	{ schoolId: "dut", name: "Da Nang University of Science and Technology" },
	{ schoolId: "tdtu", name: "Ton Duc Thang University" },
	{ schoolId: "duy_tan", name: "Duy Tan University" },
	{ schoolId: "usth", name: "University of Science and Technology of Hanoi" },
	{ schoolId: UNLISTED_SCHOOL.schoolId, name: UNLISTED_SCHOOL.schoolName },
];

export const COMPANY_DATA = [
	{
		name: "TechVision Solutions",
		description:
			"Leading software development company specializing in AI and machine learning solutions",
		website: "https://techvision.example.com",
		location: "San Francisco, CA",
		foundedYear: 2000,
		size: CompanySize["51-200"],
	},
	{
		name: "Global Finance Corp",
		description:
			"International financial services provider with expertise in digital banking",
		website: "https://globalfinance.example.com",
		location: "New York, NY",
		size: CompanySize["1000+"],
	},
	{
		name: "Creative Studio Labs",
		description:
			"Design and creative agency focused on brand identity and digital experiences",
		website: "https://creativestudio.example.com",
		location: "Los Angeles, CA",
		size: CompanySize["11-50"],
	},
	{
		name: "HealthCare Innovations",
		description:
			"Medical technology company developing healthcare software solutions",
		website: "https://healthcareinnovations.example.com",
		location: "Boston, MA",
		size: CompanySize["201-500"],
	},
	{
		name: "EduTech Learning",
		description:
			"Educational technology platform providing online learning solutions",
		website: "https://edutech.example.com",
		location: "Austin, TX",
		size: CompanySize["51-200"],
	},
	{
		name: "Green Energy Systems",
		description:
			"Renewable energy company focused on sustainable power solutions",
		website: "https://greenenergy.example.com",
		location: "Seattle, WA",
		size: CompanySize["501-1000"],
	},
	{
		name: "DataFlow Analytics",
		description:
			"Big data and analytics company helping businesses make data-driven decisions",
		website: "https://dataflow.example.com",
		location: "Chicago, IL",
		size: CompanySize["51-200"],
	},
	{
		name: "CloudSync Technologies",
		description:
			"Cloud infrastructure and services provider for modern applications",
		website: "https://cloudsync.example.com",
		location: "San Jose, CA",
		size: CompanySize["201-500"],
	},
	{
		name: "RetailPro Systems",
		description: "E-commerce and retail management software solutions",
		website: "https://retailpro.example.com",
		location: "Miami, FL",
		size: CompanySize["11-50"],
	},
	{
		name: "StartupHub Ventures",
		description: "Startup incubator and venture capital firm",
		website: "https://startuphub.example.com",
		location: "Denver, CO",
		size: CompanySize["1-10"],
	},
];

export const DEFAULT_PASSWORD = "Test@1234";
