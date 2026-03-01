import express from "express";
import { chatWithQobo } from "../controllers/chatController.js";

const router = express.Router();

router.post("/chat", chatWithQobo);

export default router;
