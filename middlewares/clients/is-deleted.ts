import { Handler } from 'express';
import createError from 'http-errors';

const isDeleted: Handler = (req, res, next) => {
  if (!res.locals.user || res.locals.user.is_deleted) {
    return next(createError(404));
  }
  return next();
};

export default isDeleted;
