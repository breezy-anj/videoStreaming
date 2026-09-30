import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  videoId: {
    type: String,
  },
  username: { type: String, required: true, trim: true, maxLength: 12 },

  text: { type: String, trim: true, maxLength: 100 },

  createdAt: {
    type: Date,
    default: Date.now,
    // not Date.now() coz then all the comments will have the same time (when the server started)
  },
});

export const Comments = mongoose.model("Comments", commentSchema);
