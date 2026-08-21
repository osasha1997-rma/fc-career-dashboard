import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import careersRouter from "./routes/careers.js";
import uploadRouter from "./routes/upload.js";

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use("/api/careers", careersRouter);
app.use("/api/upload", uploadRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(PORT, () => console.log(`🚀 CareerOS API running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });
