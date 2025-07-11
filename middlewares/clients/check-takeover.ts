import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';

const checkTakeover: Handler = async (req, res, next) => {
  if (req.user) {
    // admin takeover of account
    if ((<UserModel>req.user).user_type === 'super_admin' && req.cookies['takeover']) {
      const takeoverCookie = req.cookies['takeover'];

      res.locals.currentUser = await User.findById(takeoverCookie._id);
      res.locals.takeover = true;
    } else {
      res.locals.currentUser = req.user;
    }
  }

  next();
};

export default checkTakeover;
