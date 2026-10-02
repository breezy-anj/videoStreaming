import { Comments } from "../comments.js";

export const getComments = async (req, res) => {
  const { videoId } = req.params;

  const videoComments = await Comments.find({ videoId });

  res.json(videoComments);
};

export const addComment = async (req, res) => {
  const { videoId, username, text } = req.body;

  const comment = {
    videoId,
    username,
    text,
  };

  const newComment = await Comments.create(comment);
  if (!newComment) {
    return res.status(400).json({ message: "Error creating comment" });
  }

  res.json({ message: "Comment added" });
};
