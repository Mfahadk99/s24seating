import * as express from "express";
import takeoverInitiator from "../middlewares/clients/takeover-initiator";
import getUser from "../middlewares/clients/get-client";
import addClient from "../middlewares/clients/add-client";
import isDeleted from "../middlewares/clients/is-deleted";
import updateClient from "../middlewares/clients/update-client";
import changeProfilePhoto from "../middlewares/profile/change-profile-photo";
import { deleteClient } from "../middlewares/clients/delete-client";
import restoreClient from "../middlewares/clients/restore-client";
import filter from "../middlewares/clients/filter";
import upload from "../config/multer";
const router = express.Router();

/* GET blank page */
router.get("/", (req, res, next) => {
  res.render("clients/index");
});

router.post("/filter", filter, (req, res, next) => {
  const viewObj: any = {};
  viewObj.clients = res.locals.clients;
  viewObj.pagination = res.locals.pagination;
  res.status(200).json(viewObj);
});

router.get("/new", (req, res, next) => {
  res.render("clients/new");
});

/* POST add user page */
router.post("/", addClient, (req, res, next) => {
  res.redirect("/clients");
});

/* GET edit user page */
router.get("/edit/:id", getUser, isDeleted, (req, res, next) => {
  const viewObj: any = {};
  viewObj.user = res.locals.user;
  viewObj.venues = res.locals.venues;
  viewObj.prompts = res.locals.prompts;
  res.render("clients/edit", viewObj);
});

/* PUT update user */
router.put("/:id", updateClient, (req: any, res, next) => {
  const success = req.flash("success");
  const error = req.flash("error");

  const viewObj: any = {};
  viewObj.message = success.length ? success[0] : error[0];
  res.json(viewObj);
});

function defineTargetUser(req, res, next) {
  res.locals.targetUserId = req.params.id;
  next();
}

/* POST General/upload */
router.post("/:id/upload", defineTargetUser, upload, changeProfilePhoto);

router.delete("/:id", deleteClient, (req, res, next) => {
  res.redirect("/clients");
});

router.get("/view/:id", getUser, (req, res, next) => {
  res.render("clients/view");
});

router.get("/restore/:email", restoreClient, (req, res, next) => {
  res.redirect("/clients");
});

router.get("/takeover/:id", takeoverInitiator, (req, res, next) => {
  if (res.locals.takeover) {
    // res.redirect("/call-center/agent/details/67f365d383fe900138606e50"); // UNCOMMENT::
    res.redirect("/dashboard");
  } else {
    res.redirect("back");
  }
});

// toggle user back to super is in index.ts router

export default router;
