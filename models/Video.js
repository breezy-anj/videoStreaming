import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true }, // the actual .mp4 file in /videos/
  thumbnail: { type: String }, // filename of thumbnail image in /public/thumbnails/
  genre: { type: String },
  duration: { type: String }, // e.g. "1h 42m"
  year: { type: Number },
});

export const Video = mongoose.model("Video", videoSchema);
