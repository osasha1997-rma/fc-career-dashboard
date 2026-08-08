// ==========================================
// CareerOS — Squad Screen
// ==========================================

import { createPlayerCard, createPositionGroup } from "./components/PlayerCard.js";
import { createSearchBar, attachSearchListener } from "./components/SearchBar.js";
import { createFilterBar, attachFilterListener } from "./components/FilterBar.js";

// ── Position ordering & grouping ──────────────────────────────

const POS_ORDER = ["GK","RB","CB","LB","LWB","RWB","CDM","CM","CAM","LM","RM","LW","RW","ST","CF"];

const POS_GROUP = {
    GK:  "Goalkeepers",
    DEF: "Defenders",
    MID: "Midfielders",
    FWD: "Forwards",
};

function posGroup(pos) {
    if (pos === "GK") return "GK";
    if (["LB","CB","RB","LWB","RWB"].includes(pos)) return "DEF";
    if (["CDM","CM","CAM","LM","RM"].includes(pos)) return "MID";
    return "FWD";
}

function posRank(p) {
    const i = POS_ORDER.indexOf(p.position);
    return i === -1 ? 99 : i;
}

function sortPlayers(players) {
    return [...players].sort((a, b) => posRank(a) - posRank(b) || b.overall - a.overall);
}

// ── State ─────────────────────────────────────────────────────

const squadState = { players: [], search: "", filter: "ALL" };

// ── Render ────────────────────────────────────────────────────

export function renderSquad(players = []) {
    squadState.players = sortPlayers(players);
    const avgOvr = players.length
        ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length)
        : 0;
    const gkCount  = players.filter(p => posGroup(p.position) === "GK").length;
    const defCount = players.filter(p => posGroup(p.position) === "DEF").length;
    const midCount = players.filter(p => posGroup(p.position) === "MID").length;
    const fwdCount = players.filter(p => posGroup(p.position) === "FWD").length;

    return `
    <section class="fade">
        <div class="sq-summary">
            <span>👥 ${players.length} Players</span>
            <span>⭐ ${avgOvr} Avg OVR</span>
        </div>
        <div class="sq-depth-bar">
            <span class="sq-depth-item">GK <b>${gkCount}</b></span>
            <span class="sq-depth-item">DEF <b>${defCount}</b></span>
            <span class="sq-depth-item">MID <b>${midCount}</b></span>
            <span class="sq-depth-item">FWD <b>${fwdCount}</b></span>
        </div>
        ${createFilterBar()}
        ${createSearchBar("Search players...")}
        <div id="player-list">
            ${renderPlayerList(squadState.players)}
        </div>
    </section>`;
}

function renderPlayerList(players) {
    if (!players.length) return `<div class="sq-empty">No players found.</div>`;

    const activeFilter = squadState.filter;

    // When a specific position group is active, skip grouping
    if (activeFilter !== "ALL") {
        return players.map(p => createPlayerCard(p)).join("");
    }

    // Group by position section
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of players) groups[posGroup(p.position)].push(p);

    return ["GK","DEF","MID","FWD"]
        .filter(g => groups[g].length)
        .map(g => createPositionGroup(POS_GROUP[g], groups[g]))
        .join("");
}

// ── Filtering & search ────────────────────────────────────────

function updatePlayerList() {
    let players = sortPlayers(squadState.players);

    if (squadState.filter !== "ALL") {
        players = players.filter(p => posGroup(p.position) === squadState.filter);
    }

    if (squadState.search.length > 0) {
        players = players.filter(p =>
            p.name.toLowerCase().includes(squadState.search) ||
            p.position.toLowerCase().includes(squadState.search) ||
            p.nationality.toLowerCase().includes(squadState.search)
        );
    }

    document.getElementById("player-list").innerHTML = renderPlayerList(players);
}

// ── Init ──────────────────────────────────────────────────────

export function initializeSquad(onPlayerSelect) {
    attachSearchListener(text => { squadState.search = text.toLowerCase(); updatePlayerList(); });
    attachFilterListener(f    => { squadState.filter = f;                   updatePlayerList(); });

    document.getElementById("player-list")?.addEventListener("click", e => {
        const card = e.target.closest(".sq-card");
        if (card) onPlayerSelect?.(card.dataset.playerId);
    });
}
