import { Handler } from "express";
export const updateAccountSettings: Handler = async (req, res, next) => {
  try {
    console.log(req.body);

    console.log({ message: "Account settings updated successfully." });
    next();
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};
