import multer from "multer";
import { BadRequestError } from "../utils/appError";

const storage = multer.memoryStorage();

const uploader = multer({
	storage,
	limits: {
		fileSize: 1024 * 1024 * 2, // 2MB
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new BadRequestError("Invalid file type"));
		}
	},
});

const upload = {
	single: uploader.single.bind(uploader),
	array: uploader.array.bind(uploader),
	fields: uploader.fields.bind(uploader),
};

export default upload;
