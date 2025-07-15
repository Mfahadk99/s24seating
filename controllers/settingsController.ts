import { Request, Response } from "express";
import Settings from "../models/settings.model";

// Create new settings
export const createSettings = async (req: Request, res: Response) => {
  try {
    const settings = new Settings(req.body);
    await settings.save();
    res.status(201).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Failed to create settings",
        error: error.message,
      });
  }
};

// Get all settings
export const getAllSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await Settings.find();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch settings",
        error: error.message,
      });
  }
};

// Get settings by ID
export const getSettingsById = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findById(req.params.id);
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch settings",
        error: error.message,
      });
  }
};

// Update settings by ID
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Failed to update settings",
        error: error.message,
      });
  }
};

// Delete settings by ID
export const deleteSettings = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findByIdAndDelete(req.params.id);
    if (!settings) {
      return res
        .status(404)
        .json({ success: false, message: "Settings not found" });
    }
    res.status(200).json({ success: true, message: "Settings deleted" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete settings",
        error: error.message,
      });
  }
};
