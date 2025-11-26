import { wrapSchema } from "@/util/wrap-schema.util";
import { Joi } from "express-validation";
import { AuthorType, CreatePostDTO, MediaItem, MediaType, PostVisibilityType, UpdatePostDTO } from "@/api/model/post.model";
import { objectId } from "@/api/validation/common.validator";

const mediaItem = Joi.object<MediaItem>({
    url: Joi.string()
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

// Schema for visibility
const visibility = Joi.string()
    .valid(...Object.values(PostVisibilityType))
    .messages({
        'any.only': 'Visibility must be PRIVATE, PUBLIC, or FOLLOWER'
    });


export const createPost = {
    body: wrapSchema(
        Joi.object<CreatePostDTO>({
            author_id: Joi.any(),
            author_type: Joi.any(),
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
