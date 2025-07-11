import * as express from "express";
const router = express.Router();

/* GET Testing main page */
router.get("/", async (req, res, next) => {
  res.render("test/index");
});

export default router;
