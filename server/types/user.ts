import { Request,Response } from "express"

export interface UserBody {
    body: {
    username:string,
    first_name: string,
    last_name:string,
    phone:Number,
    email:string,
    user_password:string,
    is_alumni:boolean,
    is_verified :boolean,
    passout_year :number
    }

} 
export interface ReqMid extends Request{
    user:{
        user_id:number,
        username:string,
        first_name: string,
        last_name:string,
        phone:Number,
        email:string,
        user_password:string,
        is_alumni:boolean,
        is_verified :boolean,
        passout_year :number
    }
    token: string,
    isUserHasProfile: {
        profile_id : number
    }
}

export interface ReqPost extends ReqMid {
    body: {
        post_id: number,
        
        fk_domain_id: bigint;
        title: string;
        content: string;
        link: string;
    };
 
}

export interface ReqUtil extends ReqMid {
    body: {
        post_id: number;
    };
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

export interface ReqUser {
    user_id: number,
    username: string,
    first_name: string,
    last_name: string,
    phone: number,
    email: string,
    is_alumni:boolean,
    is_verified: boolean,
    passout_year: number,
   
}

