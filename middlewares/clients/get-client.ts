import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';

const getClient: Handler = async (req, res, next) => {
  const query: any = {
    _id: req.params.id
  };
  if ((<UserModel>req.user).user_type !== 'super_admin') {
    query.account = res.locals.currentUser.account;
  }
  try {
    const user = await User.findOne(query);

    res.locals.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default getClient;
