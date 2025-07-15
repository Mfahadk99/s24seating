import express from "express";
import {
    createSettings,
    getAllSettings,
    getSettingsById,
    updateSettings,
    deleteSettings
} from "../controllers/settingsController";

const router = express.Router();

router.get("/restaurant/:restaurantId", getAllSettings as any);
router.get("/:id", getSettingsById as any);
router.post("/", createSettings as any);
router.put("/:id", updateSettings as any);
router.delete("/:id", deleteSettings as any);

export default router;