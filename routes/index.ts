import * as express from "express";
import { UserModel } from "../models/user.model";
import restaurantRoutes from "./restaurantRoutes";
import tableRoutes from "./tableRoutes";
import floorPlanRoutes from "./floorPlanRoutes";

const router = express.Router();

/* GET home page. */
router.get("/dashboard", (req, res, next) => {
  res.render("index");
});




// get back to admin account
router.get("/release", (req, res, next) => {
  if (
    (<UserModel>req.user).user_type === "super_admin" &&
    res.locals.takeover
  ) {
    res.locals.currentUser = req.user;
    res.cookie("takeover", "", { expires: new Date(0) });
    res.redirect("/clients");
  } else {
    console.log('NOT allowed to access "/release"');
    res.redirect("back");
  }
});

export default router;
