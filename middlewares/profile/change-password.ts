import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';
import { Document } from 'mongoose';

const changePassword: Handler = async (req, res, next) => {
  const currentPassword = req.body.currentPassword;
  const password = req.body.password.replace(/\s/g, '');
  const repeatPassword = req.body.repeatPassword;

  try {
    const user = await User.findOne({ _id: res.locals.currentUser._id });

    // Check if user was found in database
    if (!user) {
      req.flash('error', 'No user found!');
      return next();
    }

    if (!currentPassword.length || !password.length || !repeatPassword.length || password !== repeatPassword) {
      req.flash('error', 'Please fillup the form correctly!');
      return next();
    }

    // change the password
    (<any>user).changePassword(
      req.body.currentPassword.replace(/\s/g, ''),
      req.body.password.replace(/\s/g, ''),
      function (err) {
        if (err) {
          if (err.name === 'IncorrectPasswordError') {
            req.flash('error', 'Incorrect Password!');
            return next();
          } else {
            req.flash('error', 'Something wrong happened! Try again later.');
            return next();
          }
        }
        req.flash('success', 'Success! Your password has been updated!');
        return next();
      }
    );
  } catch (error) {
    console.log(error);
    req.flash('error', 'Something wrong happened! Try again later.');
    return next();
  }
};

export default changePassword;
