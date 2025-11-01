
declare global {
    namespace Express {
        interface Response {
            sendJson(data?: unknown): this;
        }
    }

    type DateString = `${number}-${number}-${number}`;
}

export { };
