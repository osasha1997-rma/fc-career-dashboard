// ==========================================
// CareerOS — Data API
// ==========================================

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000/api"
    : "https://fc-career-dashboard.onrender.com/api";

async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
}

// Try the live backend; fall back to static JSON files
async function tryBackend() {
    try {
        const res = await fetch(`${API}/careers/active`, { signal: AbortSignal.timeout(2000) });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function loadAll() {
    const career = await tryBackend();

    if (career) {
        // ✅ Backend is live — use MongoDB data
        return {
            season:      career.season,
            players:     career.players,
            matches:     career.matches,
            standings:   career.standings   ?? {},
            leagueStats: career.leagueStats ?? {},
            scoutReport: career.scoutReport ?? null,
            academy:     career.academy     ?? [],
            careerId:    career._id,
        };
    }

    // ⚡ Fallback to static JSON files
    const [season, players, matches, standings, leagueStats, scoutReport, academy] = await Promise.all([
        loadJson("data/season.json"),
        loadJson("data/players.json"),
        loadJson("data/matches.json"),
        loadJson("data/standings.json").catch(() => ({})),
        loadJson("data/leagueStats.json").catch(() => ({})),
        loadJson("data/scout-report.json").catch(() => null),
        loadJson("data/academy.json").catch(() => [])
    ]);
    return { season, players, matches, standings, leagueStats, scoutReport, academy };
}

// Fetch lightweight list of all careers
export async function fetchCareers() {
    try {
        const res = await fetch(`${API}/careers`, { signal: AbortSignal.timeout(2000) });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

// Switch active career — returns full career data
export async function activateCareer(id) {
    const res = await fetch(`${API}/careers/${id}/activate`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to activate career");
    return loadAll();
}

// Add a player to a career
export async function addPlayer(careerId, playerData) {
    const res = await fetch(`${API}/careers/${careerId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
    });
    if (!res.ok) throw new Error("Failed to add player");
    return res.json();
}

// Update a player in a career
export async function updatePlayer(careerId, playerId, playerData) {
    const res = await fetch(`${API}/careers/${careerId}/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
    });
    if (!res.ok) throw new Error("Failed to update player");
    return res.json();
}

// Delete a player from a career
export async function deletePlayer(careerId, playerId) {
    const res = await fetch(`${API}/careers/${careerId}/players/${playerId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete player");
    return res.json();
}

// Create a new career with minimal data
export async function createCareer(payload) {
    const res = await fetch(`${API}/careers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create career");
    return res.json();
}
