import { Request } from 'express';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface User {
      _id: mongoose.Types.ObjectId | string;
      email?: string;
      role?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export interface IUserRequest extends Request {
  user: {
    _id: mongoose.Types.ObjectId | string;
    email?: string;
    role?: string;
  };
}
