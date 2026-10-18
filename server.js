import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDB from "./db.js";
import videoRoutes from "./routes/videoRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();
app.use(
  cors({
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  }),
);
app.use(express.json());
app.use(express.static("public"));

connectDB();
app.use("/api/video", videoRoutes);
app.use("/api/comments", commentRoutes);

app.listen(5001, () => {
  console.log("running at 5001");
});
