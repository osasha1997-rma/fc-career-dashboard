// ==========================================
// CareerOS — Data API
// ==========================================

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000/api"
    : "https://fc-career-dashboard.onrender.com/api";

// Safari-safe timeout signal (AbortSignal.timeout not available on iOS < 16)
function timeoutSignal(ms) {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
}

// Load active career from DB — no JSON fallback
export async function loadAll(careerId = null) {
    const url = careerId ? `${API}/careers/${careerId}` : `${API}/careers/active`;
    // 35s to survive Render cold-start (free tier can take 20-30s)
    const res = await fetch(url, { signal: timeoutSignal(35000) });
    if (!res.ok) throw new Error("Could not reach backend. Make sure the server is running.");
    const career = await res.json();
    return {
        season:      career.season,
        players:     career.players      ?? [],
        matches:     career.matches      ?? [],
        standings:   career.standings    ?? {},
        leagueStats: career.leagueStats  ?? {},
        scoutReport: career.scoutReport  ?? null,
        academy:     career.academy      ?? [],
        transfers:   career.transfers    ?? { ins: [], outs: [], loans: [] },
        careerId:    career._id,
    };
}

// Fetch lightweight list of all careers
export async function fetchCareers() {
    try {
        const res = await fetch(`${API}/careers`, { signal: timeoutSignal(35000) });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

// Switch active career — returns full career data scoped to that career
export async function activateCareer(id) {
    const res = await fetch(`${API}/careers/${id}/activate`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to activate career");
    return loadAll(id);
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
