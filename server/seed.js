/**
 * Seed script — run once to import existing JSON data into MongoDB.
 * Usage:  node server/seed.js
 */
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dir, ".env") });

import mongoose from "mongoose";
import Career from "./models/Career.js";

const data = p => JSON.parse(readFileSync(resolve(__dir, "../data", p), "utf8").replace(/^﻿/, ""));

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected");

const existing = await Career.findOne({ "season.club": data("season.json").club });
if (existing) {
    console.log("ℹ️  Career already seeded — skipping.");
    process.exit(0);
}

const season = data("season.json");
await Career.create({
    name:        `${season.club} ${season.season}`,
    season,
    players:     data("players.json"),
    matches:     data("matches.json"),
    standings:   data("standings.json"),
    leagueStats: data("leagueStats.json"),
    scoutReport: data("scout-report.json"),
    academy:     data("academy.json"),
    active:      true,
});

console.log(`✅ Seeded: ${season.club} ${season.season}`);
process.exit(0);
