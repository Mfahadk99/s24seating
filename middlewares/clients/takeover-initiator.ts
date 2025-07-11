import { Handler } from "express";
import User, { UserModel } from "../../models/user.model";

const takeoverInitiator: Handler = async (req, res, next) => {
  if ((<UserModel>req.user).user_type == "super_admin") {
    const user = await User.findOne({ _id: req.params.id });
    try {
      res.locals.takeover = true;
      const takeoverCookie = { _id: user._id };
      res.cookie("takeover", takeoverCookie, { httpOnly: true });
      (<UserModel>user).last_visit_date = new Date();
      await (<UserModel>user).save();
      return next();
    } catch (err) {
      return next(err);
    }
  } else {
    res.cookie("takeover", "", { expires: new Date(0) });
    return next();
  }
};

export default takeoverInitiator;
