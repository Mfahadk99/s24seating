import * as express from "express";
const router = express.Router();

/* GET Testing main page */
router.get("/", async (req, res, next) => {
    res.render("availability/index", {
        restaurantId: req.query.restaurantId
    });
});

export default router;
