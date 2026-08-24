import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

import mongoose from "mongoose";
import Career from "../models/Career.js";

await mongoose.connect(process.env.MONGO_URI);

const career = await Career.findOne({ active: true });
const xi = career.season?.startingXI ?? [];
const subs = career.season?.substitutes ?? [];

console.log(`Career: ${career.name}`);
console.log(`Season XI: ${xi.length} players, Subs: ${subs.length}`);

let patched = 0;
for (const match of career.matches) {
    if (match.result && (!match.startingXI || match.startingXI.length === 0)) {
        match.startingXI = xi;
        match.bench = subs;
        console.log(`  Patched: vs ${match.opponent} (${match.date?.slice(0,10)})`);
        patched++;
    }
}

if (patched > 0) {
    career.markModified("matches");
    await career.save();
    console.log(`Saved ${patched} patched matches.`);
} else {
    console.log("Nothing to patch.");
}

await mongoose.disconnect();
