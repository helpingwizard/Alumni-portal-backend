import { Request, Response } from "express"

export interface AdminBody {
    body: {
        username: string,
        email: string,
        password: string,
    }

}
export interface ReqMid extends Request {
    admin: {
        username: string,
        email: string,
        password: string,

    }
    token: string
}
export interface Token {

}

export interface GoogleUserData {
    name: {
        givenName: string;
        familyName: string;
    };
    emails: { value: string }[];
    // Add other properties as needed
    phone: string;
}