import express from "express";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const root   = resolve(dirname(fileURLToPath(import.meta.url)), "../../");

async function getAiConfig() {
    const raw = await readFile(resolve(root, "data/ai-config.json"), "utf8");
    return JSON.parse(raw);
}

// POST /api/ai/extract-table
// Body: { imageBase64: string, mimeType: string, competition: string }
// Returns: { rows: [{pos,team,p,w,d,l,gf,ga,pts}] }
router.post("/extract-table", async (req, res) => {
    try {
        const { imageBase64, mimeType = "image/png", competition = "" } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

        const cfg = await getAiConfig();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;

        const prompt = `Extract the league standings table from this image. Return ONLY a JSON array with no markdown, no explanation. Each element must have exactly these fields: pos (number), team (string), p (number), w (number), d (number), l (number), gf (number), ga (number), pts (number). Example: [{"pos":1,"team":"Real Madrid","p":10,"w":8,"d":1,"l":1,"gf":25,"ga":8,"pts":25}]`;

        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: imageBase64 } }
                    ]
                }]
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.text();
            return res.status(502).json({ error: "Gemini error", detail: err });
        }

        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        // Strip markdown fences if present
        const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const rows = JSON.parse(cleaned);

        res.json({ rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ai/extract-stats
// Body: { imageBase64, mimeType, statType: "scorers"|"assists"|"cleanSheets"|"yellowCards"|"redCards"|"avgRatings" }
// Returns: { rows: [{name, team, <statField>}] }
router.post("/extract-stats", async (req, res) => {
    try {
        const { imageBase64, mimeType = "image/png", statType = "scorers" } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

        const fieldMap = {
            scorers:     { field: "goals",       label: "goals scored (integer)" },
            assists:     { field: "assists",      label: "assists (integer)" },
            cleanSheets: { field: "cleanSheets",  label: "clean sheets (integer)" },
            yellowCards: { field: "yellowCards",  label: "yellow cards (integer)" },
            redCards:    { field: "redCards",     label: "red cards (integer)" },
            avgRatings:  { field: "avgRating",    label: "average rating (decimal)" },
        };
        const { field, label } = fieldMap[statType] ?? fieldMap.scorers;

        const prompt = `Extract the player statistics list from this football game screenshot. Return ONLY a JSON array with no markdown, no explanation. Each element must have: name (string, full player name), team (string, club name), ${field} (number, ${label}). Example for scorers: [{"name":"Lionel Messi","team":"FC Barcelona","${field}":15}]. Include all visible players in the list.`;

        const cfg = await getAiConfig();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;

        const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }]
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.text();
            return res.status(502).json({ error: "Gemini error", detail: err });
        }

        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const rows = JSON.parse(cleaned);

        res.json({ rows, field });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
