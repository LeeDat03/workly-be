import { Joi } from "express-validation/lib";

export const objectId = Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.pattern.base': 'Invalid ID format'
    });