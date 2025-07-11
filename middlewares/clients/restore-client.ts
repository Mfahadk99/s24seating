import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';

const restoreClient = async (req, res, next) => {
  try {
    // Remove whitespace and search for the user
    const email = req.params.email.replace(/\s/g, '');
    const user = await User.findOne({ email, user_type: 'client' }).exec();

    // Handle cases where the user is not found or not deleted
    if (!user) {
      req.flash('error', 'No user found with this email!');
      return next();
    }
    if (!user.is_deleted) {
      req.flash('error', 'You cannot restore a user that is NOT deleted!');
      return next();
    }

    // Restore the user and save the changes
    user.is_deleted = false;
    const updatedUser = await user.save();

    // Flash success message
    req.flash('success', `Success! You have restored ${updatedUser.firstname}!`);
    next();
  } catch (err) {
    // Handle any errors during the process
    console.error(err);
    req.flash('error', 'Something wrong happened! Try again later.');
    next(err);
  }
};

export default restoreClient;
