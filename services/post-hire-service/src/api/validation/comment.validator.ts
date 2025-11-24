import { Joi } from "express-validation/lib";
import { CreateCommentDTO, UpdateCommentDTO } from "../model/comment.model";
import { wrapSchema } from "@/util/wrap-schema.util";
import { objectId } from "@/api/validation/common.validator";

export const createComment = {
    body: wrapSchema(
        Joi.object<CreateCommentDTO>({
            postId: Joi.any(),      // Chấp nhận mọi giá trị
            parentId: Joi.any().optional(),
            authorId: Joi.any().optional(),
            content: Joi.any(),     // Không giới hạn nội dung
            mediaFile: Joi.any().optional(),
        })
    )
};

export const updateComment = {
    body: wrapSchema(
        Joi.object<UpdateCommentDTO>({
            content: Joi.string()
                .min(1)
                .max(1000)
                .required()
                .messages({
                    'string.empty': 'Content must not be empty',
                    'string.min': 'Content must be at least 1 character long',
                    'string.max': 'Content must not exceed 1000 characters',
                    'any.required': 'Content is required'
                }),
            mediaFile: Joi.object({
                add: Joi.string()
                    .uri()
                    .messages({
                        'string.uri': 'Media file (add) must be a valid URL',
                    }),
                delete: Joi.string()
                    .uri()
                    .messages({
                        'string.uri': 'Media file (delete) must be a valid URL',
                    }),
            })
                .optional()
                .messages({
                    'object.base': 'Media file must be an object with add/delete URLs',
                })
        })
    )
};
