import { Handler } from "express";
import { Document } from "mongoose";
import * as crypto from "crypto";
import * as sgMail from "@sendgrid/mail";
import User, { UserModel } from "../../models/user.model";
import { sendEmail } from "../../modules/send-email";
import Token, { TokenModel } from "../../models/token.model";
import { CustomError } from "../../modules/logger";
import { buildResetPasswordEmailTemplate } from "../../email-templates/reset-password";
// import smtpTransport from '../../config/mailConfig';
// import { SendMailOptions } from 'nodemailer';

const forgotPassword: Handler = async (req, res, next): Promise<void> => {
  try {
    // currently disabled
    throw new CustomError("Contact Support", "Contact Support", 404);

    let user = await User.findOne({ email: req.body.email.replace(/\s/g, "") });

    /*------------- Generate random bytes -------------*/
    const token = crypto.randomBytes(20).toString("hex");

    /*------------- Check if the user exists ------------*/
    if (!user) {
      const errorMsg = "No account with that email address exists.";
      throw new CustomError(errorMsg, errorMsg, 404);
    }

    /*------------- Set Token and expire date ----------------*/
    const resetPasswordToken = new Token(<TokenModel>{
      user: user,
      token,
      type: "reset-password",
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });
    await resetPasswordToken.save();

    /*------------- save the user back -----------------*/
    user = await user.save();
    /*---------------- Send Reset Password mail -------------*/
    const msg = {
      to: user.email,
      from: "info@mylittlehelper.com",
      subject: "MyLittleHelper Password Reset",
      html: buildResetPasswordEmailTemplate(user._id, req.headers.host, token),
    };

    await sendEmail(msg);
    req.flash(
      "success",
      `An e-mail has been sent to <span class="text-bold-600">${user.email}</span> with further instructions.`
    );
    return next();
  } catch (err) {
    const client =
      (err && err.client) || "Something wrong happened! Try again later.";
    const server =
      (err && err.server) || "Something wrong happened! Try again later.";
    const statusCode = err && err.statusCode;
    const redirectTo = (err && err.redirectTo) || "/forgot-password";
    req.flash("error", client);

    const error = new CustomError(client, server, statusCode, redirectTo);
    return next(error);
  }
};

export default forgotPassword;
