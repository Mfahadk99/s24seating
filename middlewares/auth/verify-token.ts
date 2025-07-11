import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';
import Token, { TokenModel } from '../../models/token.model';
import { CustomError } from '../../modules/logger';

const verifyToken: Handler = async (req, res, next) => {
  const type: 'reset-password' | 'verify-email' = res.locals.tokenType;
  try {
    const token = await Token.findOne({
      user: req.query.id,
      token: <string>req.query.token,
      type,
      expiresAt: <any>{ $gt: Date.now() }
    }).populate('user');

    if (!token) {
      switch (type) {
        case 'reset-password': {
          throw new CustomError('Invalid Url!', 'Password reset token is invalid or has expired.', 401);
        }
        case 'verify-email': {
          throw new CustomError('Invalid Url!', 'Verify email token is invalid or has expired.', 401);
        }
      }
    }

    if (type === 'verify-email' || type === 'reset-password') {
      token.user.status = undefined;
      await token.user.save();
    }

    if (type === 'verify-email') {
      token.expiresAt = new Date();
      await token.save();
    }

    res.locals.user = token.user;
    res.locals.token = token.token;
    return next();
  } catch (err) {
    let redirectTo: string;
    switch (type) {
      case 'reset-password': {
        redirectTo = '/forgot-password';
        break;
      }
      case 'verify-email': {
        redirectTo = '/login';
        break;
      }
      default: {
        redirectTo = err && err.redirectTo;
      }
    }
    const client = (err && err.client) || 'Something wrong happened! Try again later.';
    const server = (err && err.server) || 'Something wrong happened! Try again later.';
    const statusCode = err && err.statusCode;
    req.flash('error', client);

    const error = new CustomError(client, server, statusCode, redirectTo);
    return next(error);
  }
};

export default verifyToken;
