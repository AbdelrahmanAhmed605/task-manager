import { Request } from "express";

export interface ContextType {
  user: {
    sub: string;
    iss: string;
    client_id: string;
    origin_jti: string;
    event_id: string;
    token_use: string;
    scope: string;
    auth_time: number;
    exp: number;
    iat: number;
    jti: string;
    username: string;
  };
}

export interface AuthRequest extends Request {
  user?: ContextType["user"]; // Extend Request to include user property
}
