import * as express from "express";
import { getAccountSettings } from "../middlewares/account-settings/get-account-settings";
import Chatbot from "../models/chatbot.model";
import { updateAccountSettings } from "../middlewares/account-settings/update-account-settings";
const router = express.Router();

router.get("/", getAccountSettings, (req, res, next) => {
  res.render("account-settings/index", {
    chatbots: res.locals.chatbots,
    callAgents: res.locals.callAgents,
    mainNotificationNumber: res.locals.mainNotificationNumber,
  });
});

router.post("/", updateAccountSettings, async (req, res, next) => {
  // Redirect back to the account settings page after the update
  res.redirect("/account-settings");
});
export default router;
