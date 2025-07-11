import { Handler, Request, Response, NextFunction } from 'express';
import User from '../../models/user.model';

/**
 * Middleware to validate email existence in the database.
 *
 * Sanitizes and checks the 'email' field in the request body
 * against the user database, setting 'res.locals.isValid'
 * accordingly.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
const doesEmailExist: Handler = async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body.email, "emailemaildoesEmailExist");
  try {
    // Extract and sanitize the email from the request body
    const email = (typeof req.body.email === 'string' ? req.body.email : '').trim().toLowerCase();
    const user = await User.findOne({ email: email }, { _id: 1 });


    console.log(user, "useruser");
    // Set a response variable for clarity
    res.locals.isValid = Boolean(user);
    return next();
  } catch (error) {
    console.error('Error in doesEmailExist middleware:', error);
    res.locals.isValid = false;
    return next(error);
  }
};

export { doesEmailExist };
