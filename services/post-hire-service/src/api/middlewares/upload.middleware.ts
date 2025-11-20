import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCode } from '@/common/errors';
import { APIError } from '@/common/error/api.error';
import logger from '@/common/logger';
import { MediaItem, MediaType } from '../model/post.model';

export class UploadMiddleware {
    public static uploadFiles = () => {
        /**
         * Middleware to handle file uploads.
         *
         * This function initializes a multer storage engine to store uploaded files in a specified directory.
         * It validates the number of uploaded files against the provided keys and returns a JSON response
         * containing the uploaded file URLs.
         *
         * @returns {Function} Express middleware function
         */
        return (req: Request, res: Response, next: NextFunction): any => {
            console.log(req.files);

            let folderPath: string;

            folderPath = path.join(__dirname, `../../../uploads`);
            const ensureDirectoryExists = (dirPath: string) => {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true }); // recursive: true tạo cả thư mục cha
                }
            };
            ensureDirectoryExists(folderPath);
            ensureDirectoryExists(`${folderPath}/images`);
            ensureDirectoryExists(`${folderPath}/videos`);

            const storage = multer.diskStorage({
                destination: (req, file, cb) => {
                    if (file.mimetype.startsWith('image/')) { cb(null, `${folderPath}/images`); };
                    if (file.mimetype.startsWith('video/')) {
                        cb(null, `${folderPath}/videos`);
                    };
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
                    cb(null, uniqueSuffix);
                },
            });
            const ALLOWED_IMAGE_TYPES = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/svg+xml',
            ];

            const ALLOWED_VIDEO_TYPES = [
                'video/mp4',
                'video/mpeg',
                'video/quicktime', // .mov
                'video/x-msvideo', // .avi
                'video/x-matroska', // .mkv
                'video/webm',
            ];

            const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
            // File filter
            const fileFilter = (
                req: Request,
                file: Express.Multer.File,
                cb: multer.FileFilterCallback
            ) => {
                if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new APIError({
                            message: 'common.upload.invalid_file_type',
                            status: StatusCode.BAD_REQUEST,
                        }) as any
                    );
                }
            };

            const upload = multer({ storage, fileFilter, limits: { fileSize: 1000 * 1024 * 1024 }, }).any();

            upload(req, res, async (err) => {
                if (err) {
                    logger.error('UploadMiddleware error:', err);
                    return next(
                        new APIError({
                            message: 'common.upload.error',
                            status: StatusCode.SERVER_ERROR,
                        }),
                    );
                }

                const files = req.files as Express.Multer.File[];

                try {
                    let uploadedUrls: MediaItem[] = [];

                    files.forEach((file, index) => {
                        let fileUrl = `/uploads/${file.filename}`;
                        if (file.mimetype.startsWith('image/')) { uploadedUrls.push({ url: file.filename, type: MediaType.IMAGE }) };
                        if (file.mimetype.startsWith('video/')) { uploadedUrls.push({ url: file.filename, type: MediaType.VIDEO }) };
                    });

                    res.json({ code: 200, results: uploadedUrls });
                } catch (error) {
                    logger.error('UploadMiddleware: Error during upload processing:', error);
                    return next(
                        new APIError({
                            message: 'common.upload.failed',
                            status: StatusCode.SERVER_ERROR,
                        }),
                    );
                }
            });
        };
    };
}
