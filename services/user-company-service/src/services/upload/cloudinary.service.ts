import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "../../config/upload";

export type FileType = "avatar" | "background" | "general" | "logo" | "banner";

export interface UploadResult {
	url: string;
	publicId: string;
	resourceType: string;
}

const FOLDER_PATH = "user-company-service";

export class CloudinaryService {
	async upload({
		file,
		sourceId,
		fileType = "general",
		overwrite = false,
	}: {
		file: Express.Multer.File;
		sourceId: string;
		fileType: FileType;
		overwrite?: boolean;
	}): Promise<UploadResult> {
		try {
			const fileBuffer = file.buffer;
			const { publicId } = this.getFilePathConfig(sourceId, fileType);

			const result = await new Promise<UploadApiResponse>(
				(resolve, reject) => {
					const stream = cloudinary.uploader.upload_stream(
						{
							folder: FOLDER_PATH,
							public_id: publicId,
							overwrite: overwrite ?? false,
							eager_async: true,
						},
						(
							error: UploadApiErrorResponse | undefined,
							result: UploadApiResponse | undefined,
						) => {
							if (error) {
								return reject(error);
							}
							if (!result) {
								return reject(
									new Error(
										"Upload failed: empty response from Cloudinary",
									),
								);
							}
							return resolve(result);
						},
					);
					stream.end(fileBuffer);
				},
			);

			// Add timestamp query parameter to URL
			const timestamp = Date.now();
			const urlWithVersion = `${result.secure_url}?v=${timestamp}`;

			return {
				url: urlWithVersion,
				publicId: result.public_id,
				resourceType: result.resource_type,
			};
		} catch (error) {
			console.error("Cloudinary upload error:", error);
			throw new Error("Upload failed");
		}
	}

	async delete(publicId: string): Promise<void> {
		try {
			const result = await cloudinary.uploader.destroy(publicId);
			if (result.result !== "ok" && result.result !== "not found") {
				throw new Error(`Delete failed with result: ${result.result}`);
			}
		} catch (error) {
			console.error("Cloudinary delete error:", error);
			throw new Error("Delete failed");
		}
	}

	private getFilePathConfig(
		sourceId: string,
		fileType: FileType,
	): { publicId: string } {
		switch (fileType) {
			case "avatar":
				return {
					publicId: `user_avt_${sourceId}`,
				};
			case "background":
				return {
					publicId: `user_bg_${sourceId}`,
				};
			case "logo":
				return {
					publicId: `company_logo_${sourceId}`,
				};
			case "banner":
				return {
					publicId: `company_banner_${sourceId}`,
				};
			case "general":
			default:
				const timestamp = Date.now();
				return {
					publicId: `${sourceId}-${timestamp}`,
				};
		}
	}
}

export const cloudinaryService = new CloudinaryService();
