import { wrapSchema } from "@/util/wrap-schema.util";
import { Joi } from "express-validation";
import { AuthorType, CreatePostDTO, MediaItem, MediaType, PostVisibilityType, UpdatePostDTO } from "@/api/model/post.model";

const mediaItem = Joi.object<MediaItem>({
    url: Joi.string()
        .uri()
        .required()
        .messages({
            'string.uri': 'Invalid URL format',
            'any.required': 'URL is required'
        }),

    type: Joi.string()
        .valid(...Object.values(MediaType))
        .required()
        .messages({
            'any.only': 'Media type must be either image or video',
            'any.required': 'Media type is required'
        })
});

// Custom validator for ObjectId
const objectId = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.pattern.base': 'Invalid ID format'
    });

// Schema for visibility
const visibility = Joi.string()
    .valid(...Object.values(PostVisibilityType))
    .messages({
        'any.only': 'Visibility must be PRIVATE, PUBLIC, or FOLLOWER'
    });


export const createPost = {
    body: wrapSchema(
        Joi.object<CreatePostDTO>({
            author_type: Joi.string()
                .valid(...Object.values(AuthorType))
                .required()
                .messages({
                    'any.required': 'Author type is required',
                    'any.only': 'Invalid author type'
                }),

            author_id: objectId
                .required()
                .messages({
                    'any.required': 'Author ID is required'
                }),

            content: Joi.string()
                .min(1)
                .max(10000)
                .required()
                .messages({
                    'string.empty': 'Content must not be empty',
                    'string.min': 'Content must be at least 1 character long',
                    'string.max': 'Content must not exceed 10,000 characters',
                    'any.required': 'Content is required'
                }),

            media_url: Joi.array()
                .items(mediaItem)
                .max(10)
                .default([])
                .messages({
                    'array.max': 'No more than 10 media items can be uploaded'
                }),

            visibility: visibility
                .default('PUBLIC')
        })
    )
};


export const updatePost = {
    body: wrapSchema(
        Joi.object<UpdatePostDTO>({
            content: Joi.string()
                .min(1)
                .max(10000)
                .optional()
                .messages({
                    'string.empty': 'Content must not be empty',
                    'string.min': 'Content must be at least 1 character long',
                    'string.max': 'Content must not exceed 10,000 characters'
                }),

            media_url: Joi.object({
                add: Joi.array()
                    .items(mediaItem)
                    .max(10)
                    .default([])
                    .messages({
                        'array.max': 'No more than 10 media items can be added'
                    }),
                delete: Joi.array()
                    .items(mediaItem)
                    .max(10)
                    .default([])
                    .messages({
                        'array.max': 'No more than 10 media items can be deleted'
                    })
            })
                .optional(),

            visibility: visibility.optional()
        })
    )
};