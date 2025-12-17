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
	// Programming Languages
	{ skillId: "javascript", name: "JavaScript" },
	{ skillId: "typescript", name: "TypeScript" },
	{ skillId: "python", name: "Python" },
	{ skillId: "java", name: "Java" },
	{ skillId: "c++", name: "C++" },
	{ skillId: "c#", name: "C#" },
	{ skillId: "php", name: "PHP" },
	{ skillId: "ruby", name: "Ruby" },
	{ skillId: "swift", name: "Swift" },
	{ skillId: "kotlin", name: "Kotlin" },
	{ skillId: "rust", name: "Rust" },
	{ skillId: "go", name: "Go" },
	{ skillId: "c", name: "C" },
	{ skillId: "scala", name: "Scala" },
	{ skillId: "dart", name: "Dart" },

	// Frontend Frameworks & Libraries
	{ skillId: "react", name: "React" },
	{ skillId: "nextjs", name: "Next.js" },

	// Backend Frameworks
	{ skillId: "nodejs", name: "Node.js" },
	{ skillId: "express", name: "Express.js" },
	{ skillId: "nestjs", name: "NestJS" },
	{ skillId: "django", name: "Django" },
	{ skillId: "flask", name: "Flask" },
	{ skillId: "fastapi", name: "FastAPI" },
	{ skillId: "spring", name: "Spring Boot" },
	{ skillId: "laravel", name: "Laravel" },
	{ skillId: "rails", name: "Ruby on Rails" },
	{ skillId: "aspnet", name: "ASP.NET" },
	{ skillId: "gin", name: "Gin" },

	// Databases
	{ skillId: "mongodb", name: "MongoDB" },
	{ skillId: "postgresql", name: "PostgreSQL" },
	{ skillId: "mysql", name: "MySQL" },
	{ skillId: "redis", name: "Redis" },
	{ skillId: "elasticsearch", name: "Elasticsearch" },
	{ skillId: "oracle", name: "Oracle" },
	{ skillId: "mssql", name: "Microsoft SQL Server" },
	{ skillId: "cassandra", name: "Cassandra" },
	{ skillId: "dynamodb", name: "DynamoDB" },
	{ skillId: "firebase", name: "Firebase" },

	// DevOps & Cloud
	{ skillId: "docker", name: "Docker" },
	{ skillId: "kubernetes", name: "Kubernetes" },
	{ skillId: "aws", name: "Amazon Web Services (AWS)" },
	{ skillId: "azure", name: "Microsoft Azure" },
	{ skillId: "gcp", name: "Google Cloud Platform (GCP)" },
	{ skillId: "jenkins", name: "Jenkins" },
	{ skillId: "gitlab-ci", name: "GitLab CI/CD" },
	{ skillId: "github-actions", name: "GitHub Actions" },

	// Version Control & Tools
	{ skillId: "git", name: "Git" },
	{ skillId: "github", name: "GitHub" },
	{ skillId: "gitlab", name: "GitLab" },
	{ skillId: "bitbucket", name: "Bitbucket" },

	// API & Architecture
	{ skillId: "rest-api", name: "REST API" },
	{ skillId: "graphql", name: "GraphQL" },
	{ skillId: "grpc", name: "gRPC" },
	{ skillId: "microservices", name: "Microservices" },
	{ skillId: "websocket", name: "WebSocket" },
	{ skillId: "soap", name: "SOAP" },

	// UI/UX & Design
	{ skillId: "html", name: "HTML" },
	{ skillId: "css", name: "CSS" },
	{ skillId: "sass", name: "Sass/SCSS" },
	{ skillId: "tailwind", name: "Tailwind CSS" },
	{ skillId: "bootstrap", name: "Bootstrap" },
	{ skillId: "material-ui", name: "Material-UI" },
	{ skillId: "figma", name: "Figma" },
	{ skillId: "adobe-xd", name: "Adobe XD" },
	{ skillId: "photoshop", name: "Adobe Photoshop" },

	// Other Important Skills
	{ skillId: "agile", name: "Agile/Scrum" },
	{ skillId: "jira", name: "Jira" },
	{ skillId: "linux", name: "Linux" },
	{ skillId: "bash", name: "Bash/Shell Scripting" },
	{ skillId: "security", name: "Cybersecurity" },
	{ skillId: "blockchain", name: "Blockchain" },
	{ skillId: "ai-ml", name: "AI/Machine Learning" },
	{ skillId: "iot", name: "Internet of Things (IoT)" },
	{ skillId: "ci-cd", name: "CI/CD" },
	{ skillId: "rabbitmq", name: "RabbitMQ" },
	{ skillId: "kafka", name: "Apache Kafka" },
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
		name: "Viettel Group",
		description:
			"Vietnam's largest telecommunications company providing mobile, internet, and digital services with over 100 million subscribers",
		website: "https://vietteltelecom.vn",
		location: "Ha Noi",
		foundedYear: 1989,
		size: CompanySize["1000+"],
	},
	{
		name: "FPT Corporation",
		description:
			"Leading technology and telecommunications corporation in Vietnam, specializing in software development, IT services, and digital transformation",
		website: "https://fpt.com.vn",
		location: "Ha Noi",
		foundedYear: 1988,
		size: CompanySize["1000+"],
	},
	{
		name: "VNPT (Vietnam Posts and Telecommunications Group)",
		description:
			"State-owned telecommunications and IT services provider offering comprehensive digital solutions",
		website: "https://vnpt.com.vn",
		location: "Ha Noi",
		foundedYear: 1995,
		size: CompanySize["1000+"],
	},
	{
		name: "VNG Corporation",
		description:
			"Vietnam's leading tech unicorn specializing in digital content, online games, e-commerce, and cloud services including Zalo messaging app",
		website: "https://vng.com.vn",
		location: "Ho Chi Minh",
		foundedYear: 2004,
		size: CompanySize["1000+"],
	},
	{
		name: "FPT Software",
		description:
			"Largest IT services company in Vietnam providing software outsourcing, digital transformation, and AI solutions globally",
		website: "https://fptsoftware.com",
		location: "Ha Noi",
		foundedYear: 1999,
		size: CompanySize["1000+"],
	},
	{
		name: "CMC Corporation",
		description:
			"Leading ICT company providing system integration, software development, and digital transformation services",
		website: "https://cmc.com.vn",
		location: "Ha Noi",
		foundedYear: 1993,
		size: CompanySize["1000+"],
	},
	{
		name: "Mobifone",
		description:
			"Major telecommunications provider offering mobile, broadband, and digital services across Vietnam",
		website: "https://mobifone.vn",
		location: "Ha Noi",
		foundedYear: 1993,
		size: CompanySize["1000+"],
	},
	{
		name: "TMA Solutions",
		description:
			"Premier software outsourcing company specializing in custom software development, testing, and IT services",
		website: "https://tmasolutions.com",
		location: "Ho Chi Minh",
		foundedYear: 1997,
		size: CompanySize["1000+"],
	},
	{
		name: "KMS Technology",
		description:
			"Global software development and consulting company providing product engineering and digital transformation services",
		website: "https://kms-technology.com",
		location: "Ho Chi Minh",
		foundedYear: 2009,
		size: CompanySize["501-1000"],
	},
	{
		name: "NashTech",
		description:
			"International IT services company offering software development, QA, and digital engineering solutions",
		website: "https://nashtechglobal.com",
		location: "Ho Chi Minh",
		foundedYear: 2000,
		size: CompanySize["1000+"],
	},
	{
		name: "Tiki",
		description:
			"Leading Vietnamese e-commerce platform offering online shopping, logistics, and fintech services",
		website: "https://tiki.vn",
		location: "Ho Chi Minh",
		foundedYear: 2010,
		size: CompanySize["501-1000"],
	},
	{
		name: "Base.vn",
		description:
			"Enterprise software company providing comprehensive ERP, CRM, and business management solutions",
		website: "https://base.vn",
		location: "Ha Noi",
		foundedYear: 2012,
		size: CompanySize["201-500"],
	},
	{
		name: "Sendo",
		description:
			"Fast-growing e-commerce platform connecting buyers and sellers across Vietnam with focus on SMEs",
		website: "https://sendo.vn",
		location: "Ho Chi Minh",
		foundedYear: 2012,
		size: CompanySize["201-500"],
	},
	{
		name: "FPT Telecom",
		description:
			"Major internet service provider offering fiber optic broadband, data center, and cloud services",
		website: "https://fpttelecom.vn",
		location: "Ha Noi",
		foundedYear: 1997,
		size: CompanySize["1000+"],
	},
	{
		name: "Viettel Solutions",
		description:
			"Technology arm of Viettel Group providing IT solutions, cybersecurity, and digital transformation services",
		website: "https://viettelsolutions.vn",
		location: "Ha Noi",
		foundedYear: 2015,
		size: CompanySize["501-1000"],
	},
];

export const DEFAULT_PASSWORD = "Test@1234";
