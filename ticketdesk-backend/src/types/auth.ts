import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser & { _id: mongoose.Types.ObjectId };
}

export interface JWTPayload extends JwtPayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
}

export interface TokenData {
  token: string;
  expiresIn: number;
}
