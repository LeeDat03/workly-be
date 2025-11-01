import express from 'express';
import { StatusCode } from '@/common/errors';

express.response.sendJson = function (data?: object | any[]) {
    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object' && data !== null && !isArray;
    const isPrimitive = typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean';

    if (
        isObject &&
        (data as { data: any[]; pagination: object }).data &&
        (data as { data: any[]; pagination: object }).pagination
    ) {
        return this.json({
            errorCode: 0,
            statusCode: StatusCode.SUCCESS,
            message: (data as { message?: string })?.message || 'OK',
            data: (data as { data: any[]; pagination: object }).data,
            pagination: (data as { data: any[]; pagination: object }).pagination,
        });
    }

    return this.json({
        errorCode: 0,
        statusCode: StatusCode.SUCCESS,
        message: (isObject && (data as { message?: string })?.message) || 'OK',
        ...(isArray ? { data } : isObject ? { data } : isPrimitive ? { data } : {}),
    });
};


