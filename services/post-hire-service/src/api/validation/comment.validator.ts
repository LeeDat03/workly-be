import { Joi } from "express-validation/lib";
import { CreateCommentDTO, UpdateCommentDTO } from "../model/comment.model";
import { wrapSchema } from "@/util/wrap-schema.util";
import { objectId } from "@/api/validation/common.validator";

export const createComment = {
    body: wrapSchema(
        Joi.object<CreateCommentDTO>({
            postId: objectId
                .required()
                .messages({
                    'any.required': 'Post ID is required'
                }),

            parentId: objectId
                .optional()
                .messages({
                    'string.pattern.base': 'Invalid parent ID format'
                }),
            authorId: objectId
                .required()
                .messages({
                    'any.required': 'Author ID is required'
                }),

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

            mediaFile: Joi.string()
                .uri()
                .optional()
                .messages({
                    'string.uri': 'Media file must be a valid URL'
                })
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
