import { Handler } from 'express';
const rememberMe: Handler = (req, res, next) => {
  if (req.method == 'POST' && req.url == '/login') {
    if (req.body.rememberMe) {
      req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Remember 'me' for 30 days
    } else {
      req.session.cookie.expires = null;
    }
  }
  next();
};

export default rememberMe;
