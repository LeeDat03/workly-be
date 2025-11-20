
interface IUser {
    userId: string;
    email: string;
    name: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
        interface Response {
            sendJson(data?: unknown): this;
        }
    }

    type DateString = `${number}-${number}-${number}`;
}

export { };
