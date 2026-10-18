import express from "express";
import videoController from "../controllers/videoController.js";
import { Video } from "../models/Video.js";

const router = express.Router();

// Get all video metadata for the home page catalog
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find({});
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

// Get a single video's metadata by ID
router.get("/meta/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch video" });
  }
});

// Stream video chunks by filename
router.get("/stream/:filename", videoController);

export default router;
