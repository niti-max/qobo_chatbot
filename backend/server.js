import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import chatRoutes from "./routes/chatRoutes.js";
import { connectDB } from "./utils/db.js";

dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api", chatRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const bootstrap = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

bootstrap();
