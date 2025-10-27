/**
 * ErrorCode definition
 *
 * Success status:  2xx
 * Request error:   4xx
 * Server error:    5xx
 *
 * @export
 * @enum {number}
 */
export enum StatusCode {
    NO_ERROR = 0,

    VERIFY_FAILED = 1,

    // OK
    SUCCESS = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NON_AUTHORITATIVE_INFO = 203,
    NO_CONTENT = 204,
    RESET_CONTENT = 205,
    PARTIAL_CONTENT = 206,
    MULTI_STATUS = 207,
    ALREADY_REPORTED = 208,
    IM_USED = 226,

    // REQUEST ERROR
    BAD_REQUEST = 400,
    REQUEST_UNAUTHORIZED = 401,
    REQUEST_FORBIDDEN = 403,
    REQUEST_NOT_FOUND = 404,
    REQUEST_METHOD_NOT_ALLOWED = 405,
    REQUEST_TIMEOUT = 408,
    REQUEST_TOO_MANY = 429,
    ACCOUNT_LOCKED = 423,

    // SERVER ERROR
    SERVER_ERROR = 500,
    SERVER_NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
    SERVER_AUTH_ERROR = 511,
}

export enum ErrorCode {
    NO_ERROR = 0,

    VERIFY_FAILED = 1,

    // TOPIC ERROR
    SUCCESS = 200,

    // REQUEST ERROR
    BAD_REQUEST = 400,
    REQUEST_UNAUTHORIZED = 401,
    REQUEST_FORBIDDEN = 403,
    REQUEST_NOT_FOUND = 404,
    REQUEST_TOO_MANY = 429,
    ACCOUNT_LOCKED = 423,

    // SERVER ERROR
    SERVER_ERROR = 500,
    SERVER_AUTH_ERROR = 501, // and not know why
}

export enum ErrorKey {
    NOT_FOUND = 'not_found',
    INVALID = 'invalid',
    REQUIRED = 'required',
    EXISTED = 'existed',
}
