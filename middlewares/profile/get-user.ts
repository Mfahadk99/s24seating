import { Handler } from 'express';
import User from '../../models/user.model';

const getUser: Handler = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: res.locals.currentUser._id });
    res.locals.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default getUser;
