import { Handler } from "express";

const isLoggedIn: any = (req, res, next) => {
  // if user is authenticated in the session, carry on
  if (
    req.session["passport"] &&
    req.session["passport"]["user"] &&
    req.isAuthenticated()
  ) {
    return next();
  }
  // if they aren't redirect them to the login page
  // ajax call
  if (req.xhr) {
    return res.status(302).json(null);
  } else {
    req.session["returnTo"] = req.originalUrl;
    res.redirect("/login");
  }
};

export default isLoggedIn;
