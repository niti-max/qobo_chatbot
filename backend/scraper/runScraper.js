import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../utils/db.js";
import { crawlAndStoreFaq } from "./faqCrawler.js";

dotenv.config({ override: true });

const run = async () => {
  let exitCode = 0;

  try {
    await connectDB();
    const result = await crawlAndStoreFaq();
    console.log("FAQ scraper completed:", result);
  } catch (error) {
    console.error("FAQ scraper failed:", error.message);
    exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exitCode = exitCode;
  }
};

run();
