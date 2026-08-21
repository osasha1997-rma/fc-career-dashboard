import { Router } from "express";
import Career from "../models/Career.js";

const router = Router();

// GET /api/careers — list all careers (lightweight)
router.get("/", async (_req, res) => {
    try {
        const careers = await Career.find({}, "name season.club season.manager season.season active createdAt");
        res.json(careers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/careers/active — full data for the active career
router.get("/active", async (_req, res) => {
    try {
        const career = await Career.findOne({ active: true });
        if (!career) return res.status(404).json({ error: "No active career" });
        res.json(career);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/careers/:id — full data for a specific career
router.get("/:id", async (req, res) => {
    try {
        const career = await Career.findById(req.params.id);
        if (!career) return res.status(404).json({ error: "Career not found" });
        res.json(career);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/careers — create a new career
router.post("/", async (req, res) => {
    try {
        const career = await Career.create(req.body);
        res.status(201).json(career);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH /api/careers/:id/activate — switch active career
router.patch("/:id/activate", async (req, res) => {
    try {
        await Career.updateMany({}, { active: false });
        const career = await Career.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
        if (!career) return res.status(404).json({ error: "Career not found" });
        res.json(career);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/careers/:id — update career data (players, matches, season etc.)
router.patch("/:id", async (req, res) => {
    try {
        const career = await Career.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!career) return res.status(404).json({ error: "Career not found" });
        res.json(career);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Derive contractEnd from the career's last played match + player's duration fields
function calcContractEnd(career, playerData) {
    const years  = playerData.contractYearsLeft  ?? 0;
    const months = playerData.contractMonthsLeft ?? 0;
    if (years === 0 && months === 0) return undefined;
    const played = (career.matches ?? [])
        .filter(m => m.result && m.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!played.length) return undefined;
    const base = new Date(played[0].date);
    base.setFullYear(base.getFullYear() + years);
    base.setMonth(base.getMonth() + months);
    return base.toISOString().slice(0, 10);
}

// POST /api/careers/:id/players — add a player to a career
router.post("/:id/players", async (req, res) => {
    try {
        const career = await Career.findById(req.params.id);
        if (!career) return res.status(404).json({ error: "Career not found" });
        const newId = (career.players.reduce((max, p) => Math.max(max, p.id ?? 0), 0)) + 1;
        const contractEnd = req.body.contractEnd || calcContractEnd(career, req.body);
        const player = { id: newId, ...req.body, ...(contractEnd ? { contractEnd } : {}) };
        career.players.push(player);
        await career.save();
        res.status(201).json(player);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH /api/careers/:id/players/:playerId — update a player
router.patch("/:id/players/:playerId", async (req, res) => {
    try {
        const career = await Career.findById(req.params.id);
        if (!career) return res.status(404).json({ error: "Career not found" });
        const pid = parseInt(req.params.playerId);
        const idx = career.players.findIndex(p => p.id === pid);
        if (idx === -1) return res.status(404).json({ error: "Player not found" });
        const merged = { ...career.players[idx], ...req.body };
        const contractEnd = merged.contractEnd || calcContractEnd(career, merged);
        if (contractEnd) merged.contractEnd = contractEnd;
        Object.assign(career.players[idx], merged);
        career.markModified("players");
        await career.save();
        res.json(career.players[idx]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/careers/:id/players/:playerId — remove a player
router.delete("/:id/players/:playerId", async (req, res) => {
    try {
        const career = await Career.findById(req.params.id);
        if (!career) return res.status(404).json({ error: "Career not found" });
        const pid = parseInt(req.params.playerId);
        career.players = career.players.filter(p => p.id !== pid);
        await career.save();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/careers/:id
router.delete("/:id", async (req, res) => {
    try {
        await Career.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
