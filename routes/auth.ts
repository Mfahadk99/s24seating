import * as express from "express";
const router = express.Router();
import User, { UserModel } from "../models/user.model";
import * as passport from "passport";
import forgotPassword from "../middlewares/auth/forgot-password";
import verifyToken from "../middlewares/auth/verify-token";
import resetPassword from "../middlewares/auth/reset-password";
import * as crypto from "crypto";
import { CustomError } from "../modules/logger";
import Token, { TokenModel } from "../models/token.model";
import { sendEmail } from "../modules/send-email";
import { buildVerifyEmailEmailTemplate } from "../email-templates/verify-email";
import { doesEmailExist } from "../middlewares/auth/does-email-exist";
import { isSuspiciousLogin } from "../modules/auth/is-suspicious-login";
import * as requestIp from "request-ip";
import userAgentParser from "ua-parser-js";
import { generate2faCode } from "../modules/auth/generate-2fa-code";
import { sendText } from "../modules/sender/send-text";
import * as fs from "fs";
import jwt from 'jsonwebtoken';

/* GET signup page. */
router.get("/signup", (req: any, res, next) => {
  return res.redirect("/login"); // CLOSE SIGN UP
  res.render("auth/signup");
});

/* passport-local-mongoose is used for authentication. In the future, in case someone wants to change it, here are
 *  routes that would require the work.
 *  (1) /signup
 *  (2) /login
 *  (3) /forgot-password
 *  (4) /change-password
 */

/* POST signup page. */
router.post("/signup", async (req: any, res, next) => {
  try {
    // TODO: validate request's body (firstName, lastName, email, password)
    return res.redirect("/login"); // CLOSE SIGN UP
    let user: any = await User.findOne({
      email: req.body.email.replace(/\s/g, ""),
    });

    if (user) {
      req.flash(
        "error",
        `There is an email associated with this account! <a href="/forgot-password">Forgot Password?</a>`,
      );
      return res.redirect("/signup");
    }

    if (user && (<UserModel>user).is_deleted) {
      req.flash(
        "error",
        "There is an inactive account with this email! To restore the account, please go through the 'Forgot Password' process.",
      );
      return res.redirect("/signup");
    }

    const newUser = new User(<UserModel>{
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email.replace(/\s/g, ""),
      user_type: "client",
    });

    // assign admin's _id as account
    (<any>newUser).account = newUser._id;
    // register function is made available by passport-local-mongoose, this will take care of hash and salt
    user = await (<any>User).register(
      newUser,
      req.body.password.replace(/\s/g, ""),
    );

    // send a verification message

    /*------------- Generate random bytes -------------*/
    const token = crypto.randomBytes(20).toString("hex");

    /*------------- Set Token and expire date ----------------*/
    const verifyEmailToken = new Token(<TokenModel>{
      user: user,
      token,
      type: "verify-email",
      expiresAt: new Date(Date.now() + 24 * 3600000), // 24 hour
    });
    await verifyEmailToken.save();

    /*------------- set user status to unverified -----------------*/
    user.status = "unverified";
    /*------------- save the user back -----------------*/
    user = await user.save();
    /*---------------- Send Reset Password mail -------------*/
    const msg = {
      to: user.email,
      from: "info@mylittlehelper.com",
      subject: "MyLittleHelper Password Reset",
      html: buildVerifyEmailEmailTemplate(user._id, req.headers.host, token),
    };
    await sendEmail(msg);
    req.flash(
      "success",
      `Welcome to 247 Seating, to complete your registration we need to verify your email first. Please follow the e-mail we sent to <span style="font-weight:bold;">${user.email}</span>`,
    );

    return res.redirect("/login");

    // passport.authenticate('local')(req:any, res, () => {
    //   // console.log('successfully registered: ', user);
    //   res.redirect('/');
    // });
  } catch (err) {
    if (err && err.message) {
      req.flash("error", err.message.replace("username", "email"));
      return next(new CustomError(err, err, 500, "/signup"));
    }
    return next(err);
  }
});

/* GET Reset Password page */
router.get(
  "/verify_email",
  (req: any, res, next) => {
    res.locals.tokenType = "verify-email";
    next();
  },
  verifyToken,
  (req: any, res, next) => {
    req.flash(
      "success",
      "You have successfully verified your email! You can now login with your email and password.",
    );
    return res.redirect("/login");
  },
);

/* GET login page. */
router.get("/login", async (req: any, res, next) => {
  const findAllUsers = await User.find({});
  // console.log(findAllUsers, "findAllUsers");
  res.render("auth/login");
});

/* In first step login process, verify the email  */
router.post(
  "/login/email-exist",
  doesEmailExist,
  async (req: any, res, next) => {
    console.log(req.body.email,"emailemail");
    req.session["email"] = req.body.email;
    res.status(200).json(res.locals.isValid);
  },
);

/* POST login page. */
router.post("/login", (req: any, res, next) => {
  try {
    if (req.session["email"] !== req.body.email) return res.redirect("/login");
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const userDoc = await User.findOne({ email: req.body.email });
        // check if the user exists
        if (userDoc) {
          // check if the account is locked
          if (userDoc.is_locked) {
            req.flash(
              "error",
              `This account has been locked due to too many failed login attempts. Please contact customer support to unlock your account.</a>.`,
            );
            return res.redirect("/login");
          }

          // increment the number of failed attempts
          const failedLoginAttempts = userDoc.failed_login_attempts + 1;
          // lock the account if max login attempts is reached / 5 attempts max
          if (failedLoginAttempts >= 5 && !userDoc.is_locked) {
            userDoc.is_locked = true;
          }
          userDoc.failed_login_attempts = failedLoginAttempts;
          await userDoc.save();
        }
        req.flash("error", "Incorrect email or password!");
        return res.redirect("/login");
      }

      if ((<UserModel>user).is_deleted) {
        req.flash(
          "error",
          `This account has been inactivated. To restore the account, please <a href="/forgot-password">change your password</a>.`,
        );
        return res.redirect("/login");
      }

      if ((<UserModel>user).is_locked) {
        req.flash(
          "error",
          `This account has been locked due to too many failed login attempts. Please contact customer support to unlock your account.</a>.`,
        );
        return res.redirect("/login");
      }

      if ((<UserModel>user).status === "unverified") {
        req.flash(
          "error",
          `<span>Please verify your email first! OR <a href="/forgot-password" class="text-primary">change password!</a>`,
        );
        return res.redirect("/login");
      }

      if ((<UserModel>user).is_2fa_enabled) {
        if (await isSuspiciousLogin(req, user)) {
          // send the code and redirect
          req.session["is2FACodeRequired"] = true;
          req.session["email"] = req.body.email;
          req.session["code"] = generate2faCode();
          console.log(req.session["code"]);
          const expirationTime = new Date();
          expirationTime.setMinutes(expirationTime.getMinutes() + 2);
          req.session["validUpTo"] = expirationTime.getTime(); // Store it as a timestamp (number)
          const clientNumber = (<UserModel>user).phone_numbers[0].phone_number;
          await sendText({
            from: "+18449190800",
            to: clientNumber,
            text: "Your MyLittleHelper security code is " + req.session["code"],
          });
          return res.redirect("/login/2fa");
        }
      }

      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        // Store token in cookie
        res.cookie('authToken', token, {
          httpOnly: false, // Allow JavaScript access
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Also store in localStorage via JavaScript
        res.cookie('authTokenClient', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000
        });

        console.log('=== LOGIN SUCCESS ===');
        console.log('User ID:', user._id);
        console.log('User Email:', user.email);
        console.log('Access Token:', token);
        console.log('====================');

        // remove the takeover before login
        res.cookie("takeover", "", { expires: new Date(0) });
        // save last vist
        (<UserModel>user).last_visit_date = new Date();
        (<UserModel>user).failed_login_attempts = 0;
        await (<UserModel>user).save();
        // return res.redirect(
        //   "/call-center/agent/details/67f365d383fe900138606e50",
        // ); // COMMENT:
        return res.redirect("/dashboard"); // UNCOMMENT::
      });
    })(req, res, next);
  } catch (error) {
    return next(error);
  }
});

/* GET 2FA query page if suspicious login attemt */
router.get("/login/2fa", (req: any, res, next) => {
  const sessionData = req.session;
  // There is no need to 2fa code
  if (!sessionData["is2FACodeRequired"]) return res.redirect("/login");

  // calculate the time to expiry
  let timeRemainingInSeconds = 0;
  const expirationTimeTimestamp: number | undefined = sessionData["validUpTo"];
  let expirationTime: Date | undefined;
  if (expirationTimeTimestamp) {
    expirationTime = new Date(expirationTimeTimestamp); // Convert it back to a Date object
  }
  // The code is still valid
  const currentTime: Date = new Date();
  timeRemainingInSeconds = Math.max(
    0,
    Math.floor((expirationTime.getTime() - currentTime.getTime()) / 1000),
  );
  // Render the 2FA page and pass the remaining time as a variable
  res.render("auth/login-code", {
    remainingTimeInSeconds: timeRemainingInSeconds,
  });
});

router.post("/login/2fa", async (req: any, res, next) => {
  try {
    const submittedCode = req.body.code;
    const sessionData = req.session;
    if (!sessionData["is2FACodeRequired"]) return res.redirect("/login");
    if (
      submittedCode === sessionData["code"] &&
      new Date() < new Date(sessionData["validUpTo"])
    ) {
      const email = sessionData["email"];
      const user = await User.findOne({ email });

      if (!user) {
        // Handle user not found
        return res.redirect("/login/2fa");
      }

      // Log the user in
      req.login(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Remove session variables
        delete req.session["is2FACodeRequired"];
        delete req.session["code"];
        delete req.session["validUpTo"];
        delete req.session["email"];

        // Clear the takeover cookie
        res.clearCookie("takeover");

        // Save the last visit date
        user.last_visit_date = new Date();
        user.failed_login_attempts = 0;

        // get user-agent header
        const ua = userAgentParser(req.headers["user-agent"]);
        const userDeviceInfo = JSON.stringify(ua, null, "  ");

        // set login details
        user.verified_devices.push({
          device_info: userDeviceInfo,
          ip_address: requestIp.getClientIp(req) || undefined,
        });

        await user.save();

        return res.redirect("/dashboard");
      });
    } else {
      // Handle 2FA code validation failure
      req.session["failed2faAttempts"] = req.session["failed2faAttempts"]
        ? +req.session["failed2faAttempts"] + 1
        : 1;

      // lock the account if max attempts reached
      if (+req.session["failed2faAttempts"] >= 5) {
        // lock the account
        await User.updateOne(
          { email: req.session["email"] },
          {
            $set: {
              is_locked: true,
              failed_login_attempts: +req.session["failed2faAttempts"],
            },
          },
        );
        delete req.session["is2FACodeRequired"];
        delete req.session["code"];
        delete req.session["validUpTo"];
        delete req.session["email"];
        delete req.session["failed2faAttempts"];
        return res.redirect("/login");
      } else {
        return res.redirect("/login/2fa");
      }
    }
  } catch (err) {
    // Handle other errors, log them, and return an appropriate response
    console.error(err);
    return res.redirect("/login/2fa");
  }
});

router.get("/login/2fa/resend-code", async (req: any, res, next) => {
  const sessionData = req.session;
  // There is no need to 2fa code
  if (!sessionData["is2FACodeRequired"]) return res.redirect("/login");

  // add a failed attempt and resend the code if max attempts is NOT reached
  req.session["failed2faAttempts"] =
    (sessionData["failed2faAttempts"] || 0) + 1;

  // lock the account
  if (+req.session["failed2faAttempts"] >= 3) {
    // lock the account
    await User.updateOne(
      { email: req.session["email"] },
      {
        $set: {
          is_locked: true,
          failed_login_attempts: +req.session["failed2faAttempts"],
        },
      },
    );
    // Clear session data
    delete req.session["is2FACodeRequired"];
    delete req.session["code"];
    delete req.session["validUpTo"];
    delete req.session["email"];
    delete req.session["failed2faAttempts"];
    return res.redirect("/login");
  }

  // send the code
  req.session["code"] = generate2faCode();
  console.log(req.session["code"]);
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 2);
  req.session["validUpTo"] = expirationTime.getTime(); // Store it as a timestamp (number)
  // sendNotificationText('+18449190800', '+13125550196', 'Your MyLittleHelper security code is ' + req.session['code']);
  return res.redirect("/login/2fa");
});

/* GET forgot-password page. */
router.get("/forgot-password", (req: any, res, next) => {
  res.render("auth/forgot-password");
});

/* POST forgot-password page. */
router.post("/forgot-password", forgotPassword, (req: any, res, next) => {
  res.redirect("/forgot-password");
});

/* GET Reset Password page */
router.get(
  "/reset",
  (req: any, res, next) => {
    res.locals.tokenType = "reset-password";
    next();
  },
  verifyToken,
  (req: any, res, next) => {
    const viewObj: { user: UserModel; resetPasswordToken: string } = {
      user: null,
      resetPasswordToken: null,
    };

    viewObj.user = res.locals.user;
    viewObj.resetPasswordToken = res.locals.token;

    res.render("auth/reset-password", viewObj);
  },
);

/* POST Reset Password page */
router.post("/reset", resetPassword, (req: any, res, next) => {
  res.redirect("/login");
});

/* Logout Route */
router.get("/logout", (req: any, res, next) => {
  res.cookie("takeover", "", { expires: new Date(0) });
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

export default router;
