import { Handler } from 'express';
import createError from 'http-errors';
import User, { UserModel } from '../../models/user.model';
import * as _ from 'lodash';
import { Document } from 'mongoose';
import { CustomError } from '../../modules/logger';
import { isStrongPassword } from '../../modules/auth/is-strong-password';

const addClient: Handler = async (req, res, next) => {
  try {
    // if email || password is not set, throw error
    if (req.body.email.replace(/\s/g, '').length === 0 || _.isEmpty(req.body.password)) {
      const errorMsg = 'Either email or password is not set';
      throw new CustomError(errorMsg, errorMsg, 400);
    }

    // check password
    const password = req.body.password.replace(/\s/g, '');
    if (!isStrongPassword(password)) {
      const errorMsg =
        'Password must meet the following criteria:\n' +
        '- Minimum length of 8 characters.\n' +
        '- At least one uppercase letter (A-Z).\n' +
        '- At least one lowercase letter (a-z).\n' +
        '- At least one numeric digit (0-9).\n' +
        '- At least one special character (e.g., !@#$%^&*()_+{}[]:;<>,.?~\\-).';

      throw new CustomError(errorMsg, errorMsg, 422);
    }

    const address = {
      country: req.body.country && req.body.country.length ? req.body.country : undefined,
      state: req.body.state && req.body.state.length ? req.body.state : undefined,
      city: req.body.city && req.body.city.length ? req.body.city : undefined,
      zipcode: req.body.zipcode && req.body.zipcode.length ? req.body.zipcode : undefined,
      street: req.body.street && req.body.street.length ? req.body.street : undefined
    };

    // phone numbers
    const phone_numbers = [];

    if (!_.isEmpty(req.body.phoneNumber1)) {
      const phone_number1 = {
        phone_number: req.body.phoneNumber1.replace(/\s/g, '').length
          ? req.body.phoneNumber1.replace(/\s/g, '')
          : undefined,
        is_active: true
      };

      phone_numbers.push(phone_number1);
    }

    if (!_.isEmpty(req.body.phoneNumber2)) {
      const phone_number2 = {
        phone_number: req.body.phoneNumber2.replace(/\s/g, '').length
          ? req.body.phoneNumber2.replace(/\s/g, '')
          : undefined,
        is_active: false
      };

      // change status to active if number one is not inserted
      if (_.isEmpty(req.body.phoneNumber1)) {
        phone_number2.is_active = true;
      }

      phone_numbers.push(phone_number2);
    }

    // update the requested attributes
    const newUser = new User(<UserModel>{
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      website: req.body.website,
      email: req.body.email.replace(/\s/g, '').toLowerCase(),
      phone_numbers: phone_numbers,
      address: address,
      user_type: 'client'
    });
    (<UserModel & Document>newUser).account = newUser._id;

    const user = await (<any>User).register(newUser, password);

    console.log('new User registered: ', user.email);
    return next();
  } catch (err) {
    if (err.code == '11000' || err.name == 'UserExistsError') {
      try {
        const user = await User.findOne({ email: req.body.email.replace(/\s/g, ''), user_type: 'client' });
        if (!user || !user.is_deleted) {
          err.message = `This email is already used! Please try with a different email!`;
          throw new CustomError(err, err, 409);
        }
        err.message = `This account was deleted. If you want to restore the account, `;
        err.link = `/clients/restore/${req.body.email}`;
        throw new CustomError(err, err, 404);
      } catch (err) {
        return next(err);
      }
    }
    return next(err);
  }
};

export default addClient;
