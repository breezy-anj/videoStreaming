import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Video } from "./models/Video.js";

const videos = [
  {
    title: "Big Buck Bunny",
    description:
      "A large, lovable rabbit deals with three bullying rodents. A classic open-source animated short.",
    filename: "big_buck_bunny.mp4",
    thumbnail: "thumb_bbb.jpg",
    genre: "Animation",
    duration: "9m 56s",
    year: 2008,
  },
  {
    title: "Elephant Dream",
    description:
      "The story of two characters exploring a bizarre and surreal mechanical world.",
    filename: "elephant_dream.mp4",
    thumbnail: "thumb_ed.jpg",
    genre: "Animation",
    duration: "10m 54s",
    year: 2006,
  },
  {
    title: "Tears of Steel",
    description:
      "In a dystopian future, a group of warriors fight to save the world from machines. A Blender Foundation film.",
    filename: "tears_of_steel.mp4",
    thumbnail: "thumb_tos.jpg",
    genre: "Sci-Fi",
    duration: "12m 14s",
    year: 2012,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Video.deleteMany({});
    console.log("Cleared existing videos");

    await Video.insertMany(videos);
    console.log(`Seeded ${videos.length} videos`);

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
