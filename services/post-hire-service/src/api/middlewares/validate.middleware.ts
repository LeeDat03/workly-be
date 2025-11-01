import { schema, validate } from 'express-validation';


export const validateRequest = (schema: schema) =>
    validate(schema, {
        context: true,
        // keyByField: true,
    });
