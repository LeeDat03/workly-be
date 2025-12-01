import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCode } from '@/common/errors';
import { APIError } from '@/common/error/api.error';
import logger from '@/common/logger';
import { MediaItem, MediaType } from '../model/post.model';

// Thêm enum cho CV type
export enum FileType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    CV = 'CV'
}

export interface UploadedFile {
    url: string;
    type: FileType;
}

export class UploadMiddleware {
    public static uploadFiles = () => {
        /**
         * Middleware to handle file uploads (images, videos, and CVs).
         *
         * This function initializes a multer storage engine to store uploaded files in a specified directory.
         * It validates the number of uploaded files and returns a JSON response
         * containing the uploaded file URLs.
         *
         * @returns {Function} Express middleware function
         */
        return (req: Request, res: Response, next: NextFunction): any => {
            console.log(req.files);

            const folderPath = path.join(__dirname, `../../../uploads`);

            // Ensure directories exist
            const ensureDirectoryExists = (dirPath: string) => {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            };

            ensureDirectoryExists(folderPath);
            ensureDirectoryExists(`${folderPath}/images`);
            ensureDirectoryExists(`${folderPath}/videos`);
            ensureDirectoryExists(`${folderPath}/cvs`); // Thêm folder cho CV

            // Configure storage
            const storage = multer.diskStorage({
                destination: (req, file, cb) => {
                    if (file.mimetype.startsWith('image/')) {
                        cb(null, `${folderPath}/images`);
                    } else if (file.mimetype.startsWith('video/')) {
                        cb(null, `${folderPath}/videos`);
                    } else if (
                        file.mimetype === 'application/pdf' ||
                        file.mimetype === 'application/msword' ||
                        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ) {
                        cb(null, `${folderPath}/cvs`); // CV files
                    } else {
                        cb(new Error('Invalid file type'), '');
                    }
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
                    cb(null, uniqueSuffix);
                },
            });

            // Allowed file types
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

            const ALLOWED_CV_TYPES = [
                'application/pdf',
                'application/msword', // .doc
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            ];

            const ALLOWED_MIME_TYPES = [
                ...ALLOWED_IMAGE_TYPES,
                ...ALLOWED_VIDEO_TYPES,
                ...ALLOWED_CV_TYPES,
            ];

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

            // Upload configuration
            const upload = multer({
                storage,
                fileFilter,
                limits: { fileSize: 1000 * 1024 * 1024 }, // 1000MB max
            }).any();

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
                    const uploadedUrls: UploadedFile[] = [];

                    files.forEach((file) => {
                        let fileType: FileType;
                        let fileUrl: string;

                        if (file.mimetype.startsWith('image/')) {
                            fileType = FileType.IMAGE;
                            fileUrl = file.filename;
                        } else if (file.mimetype.startsWith('video/')) {
                            fileType = FileType.VIDEO;
                            fileUrl = file.filename;
                        } else if (ALLOWED_CV_TYPES.includes(file.mimetype)) {
                            fileType = FileType.CV;
                            fileUrl = `/uploads/cvs/${file.filename}`;
                        } else {
                            return; // Skip unsupported files
                        }

                        uploadedUrls.push({
                            url: fileUrl,
                            type: fileType,
                        });
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