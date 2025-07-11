import { Handler } from "express";

export const getAccountSettings: Handler = async (req, res, next) => {
  try {
    return next();
  } catch (error) {
    console.log("error", "Something wrong happened, please try again later.");
    next(error);
  }
};
