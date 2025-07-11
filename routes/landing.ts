import * as express from "express";
const router = express.Router();
import upload from "../config/multer";

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("landing/index", { user: res.locals.currentUser });
});

router.get("/new", (req, res, next) => {
  res.render("landing/new", { user: res.locals.currentUser });
});

router.get("/contact", (req, res, next) => {
  res.render("landing/contact");
});

router.get("/privacy-policy", (req, res, next) => {
  res.render("landing/privacy-policy");
});


router.get("/single-feature", (req, res, next) => {
  res.render("landing/single-feature");
});

router.get("/single-feature/:divId", (req, res, next) => {
  res.render("landing/single-feature");
});

/* Upload receipt - public  */
router.get("/loyalty/receipt/:pointsRequestMsgId", (req, res) => {
  res.render("loyalty/public/receipt");
});

router.get("/under-construction", (req, res) => {
  res.render("landing/under-construction");
});

export default router;
