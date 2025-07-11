import User, { UserModel } from '../../models/user.model';
import { Handler } from 'express';
/**
 * Gets a list of all active clients with all the details included.
 * The list is saved in res.locals.clients
 */
const getClients: Handler = async (req, res, next) => {
  try {
    const clients: UserModel[] = await User.find({
      user_type: 'client',
      is_deleted: false,
      status: { $ne: 'unverified' }
    });
    res.locals.clients = clients;
    return next();
  } catch (err) {
    return next(err);
  }
};

export { getClients };
