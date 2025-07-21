import { Users } from "src/entities/users.entity";

declare module 'express' {
    interface Request {
        user: Users;
    }
}