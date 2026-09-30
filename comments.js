import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  videoId: {
    type: String,
  },
  username: { type: String, require: true, trim: true, maxLength: 12 },

  text: { type: String, trim: true, maxLength: 100 },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export const Comments = mongoose.model("Comments", commentSchema);
