import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';
import Token, { TokenModel } from '../../models/token.model';
import { CustomError } from '../../modules/logger';

const resetPassword: Handler = async (req, res, next) => {
  try {
    const token = await Token.findOne({
      user: req.body.user_id,
      token: <string>req.body.token,
      type: 'reset-password',
      expiresAt: <any>{ $gt: Date.now() }
    }).populate('user');

    if (!token) {
      const errorMsg = 'Password reset token is invalid or has expired.';
      throw new CustomError(errorMsg, errorMsg, 401);
    }

    if (req.body.password === req.body.repeatPassword.replace(/\s/g, '')) {
      // console.log('user before changing password: ', user);
      let user = <UserModel>token.user;
      user = await (<any>user).setPassword(req.body.password.replace(/\s/g, ''));

      // console.log('user after changing password: ', user);
      token.expiresAt = new Date();

      user.is_deleted = false;
      await token.save();
      await user.save();

      req.flash('success', 'Success! Your password has been updated. Please login with your new password.');
      res.locals.isValid = true;
      return next();
    } else {
      const errorMsg = 'Passwords did not match!';
      throw new CustomError(errorMsg, errorMsg, 401);
    }
  } catch (err) {
    const client = (err && err.client) || 'Something wrong happened! Try again later.';
    const server = (err && err.server) || 'Something wrong happened! Try again later.';
    const statusCode = err && err.statusCode;
    const redirectTo = (err && err.redirectTo) || '/forgot-password';
    req.flash('error', client);

    const error = new CustomError(client, server, statusCode, redirectTo);
    return next(error);
  }
};

export default resetPassword;
