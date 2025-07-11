import { Handler } from 'express';
import { Document } from 'mongoose';
import createError from 'http-errors';
import User, { UserModel } from '../../models/user.model';
import { CustomError } from '../../modules/logger';

export const deleteClient: Handler = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // make sure the user is not deleting himself
    if (targetUserId == res.locals.currentUser._id) {
      throw new CustomError('You cannot remove yourself!', 'User attempted to delete himself!', 401);
    }

    const query: any = {
      _id: targetUserId
    };
    if ((<UserModel>req.user).user_type !== 'super_admin') {
      query.account = res.locals.currentUser.account;
    }

    // check if he is the right admin
    const user = await User.findOne(query);

    if (!user) {
      throw new CustomError('You are not authorized to perform this operation!', 'User is not the right admin!', 401);
    }

    // check if the to-be-deleted user has unpaid bills
    /* 
    const billCount = await BillingCycle.countDocuments({
      user: user._id,
      paidAt: { $exists: false },
      $or: [{ phone_numbers: { $ne: [] } }, { sms: { $ne: [] } }, { mms: { $ne: [] } }]
    }).exec();

    if (billCount) {
      throw new CustomError(
        'This user has unpaid bills!\n Please pay them before deleting their account!',
        'User cannot be deleted: User has unpaid bills!',
        401
      );
    } */

    // soft-delete the user

    user.is_deleted = true;
    await user.save();
    req.flash('success', 'User has been removed!');
    return next();
  } catch (err) {
    err = err || {};
    req.flash('error', err.client || 'Something went wrong!');
    const error = new CustomError(
      err.client || 'Something went wrong!',
      err.server || err,
      err.status || 500,
      '/clients'
    );
    return next(error);
  }
};
