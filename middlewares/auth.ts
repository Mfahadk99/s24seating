import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

// Extend Request interface to include user
export interface IUserRequest extends Request {
  user?: {
    _id: string;
    email: string;
    firstname: string;
    lastname: string;
    user_type: string;
  };
}

// Authentication middleware (for both EJS and API routes)
export const authenticateToken = async (req: IUserRequest, res: Response, next: NextFunction) => {
  try {
    //  Get token from cookies (prefer admin token, fallback to client token)
    const token = req.cookies.authToken || req.cookies.authTokenClient;

    if (!token) {
      // redirect to login
      return res.status(401).render('auth/login', { error: 'Please login to continue' });

      // If API only: return JSON
      // return res.status(401).json({ message: 'Access token required' });
    }

    //  Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    //  Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).render('auth/login', { error: 'User not found' });
    }

    //  Check if user is active
    if (user.is_deleted || user.is_locked || user.status === 'unverified') {
      return res.status(403).render('auth/login', { error: 'Account is inactive or locked' });
    }

    //  Attach user to request
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      user_type: user.user_type,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).render('auth/login', { error: 'Invalid token. Please login again.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).render('auth/login', { error: 'Session expired. Please login again.' });
    }

    console.error('❌ Authentication Error:', error);
    return res.status(500).render('error/500', { error: 'Authentication failed' });
  }
};
