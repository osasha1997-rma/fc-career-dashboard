import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

import mongoose from "mongoose";
import Career from "../models/Career.js";
const CLOUD = "liftnro4";
const PRESET = "careeros_players";

async function uploadBase64(base64) {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 string");
    const mime = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const fd = new FormData();
    fd.set("upload_preset", PRESET);
    fd.set("file", new Blob([buffer], { type: mime }), "photo.jpg");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
        method: "POST",
        body: fd,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Cloudinary error: ${err}`);
    }
    const data = await res.json();
    return data.secure_url;
}

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const careers = await Career.find({});
for (const career of careers) {
    let changed = false;
    for (const player of career.players) {
        if (player.photo && player.photo.startsWith("data:")) {
            console.log(`  Uploading photo for ${player.name} (${career.name})…`);
            try {
                player.photo = await uploadBase64(player.photo);
                console.log(`    → ${player.photo}`);
                changed = true;
            } catch (err) {
                console.error(`    ✗ Failed: ${err.message} — clearing photo`);
                player.photo = "";
                changed = true;
            }
        }
    }
    if (changed) {
        career.markModified("players");
        await career.save();
        console.log(`Saved ${career.name}`);
    }
}

console.log("Migration complete.");
await mongoose.disconnect();
