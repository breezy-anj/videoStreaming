import express from "express";
import { addComment, getComments } from "../controllers/commentController.js";

const router = express.Router();

router.get("/:videoId", getComments);
router.post("/", addComment);

export default router;
