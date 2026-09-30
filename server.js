import express from "express";
import cors from "cors";
import connectDB from "./db.js";

const app = express();
app.get("/", (req, res) => {
  res.json({ message: "works" });
});

app.use(cors({ exposedHeaders: ["Content-Range", "Accept-Ranges",'Content-Length'] }));

connectDB();

app.listen(5001, () => {
  console.log("running at 5001");
});

