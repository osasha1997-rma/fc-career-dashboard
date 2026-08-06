// ==========================================
// CareerOS — Lineup: Starting XI + Bench
// ==========================================

// Maps a player's primary position to a tactical line.
// Higher number = more attacking. Used to build pitch rows.
const POSITION_LINE = {
    GK:  0,
    RB:  1, CB:  1, LB:  1, RWB: 1, LWB: 1,
    CDM: 2,
    CM:  3, LM:  3, RM:  3, CAM: 3,
    RW:  4, LW:  4, ST:  4, CF:  4
};

export function createLineup(match, players) {
    const events     = buildEventMap(match);
    const xiPlayers  = resolveSquad(match.startingXI ?? [], players);
    const benchPlayers = resolveSquad(match.bench ?? [], players);

    return `
        <div class="lineup-pitch">
            ${renderPitch(xiPlayers, events)}
        </div>
        <p class="md-sub-label" style="margin-top:16px">Bench</p>
        <div class="bench-grid">
            ${benchPlayers.map(p => renderBenchCard(p, events)).join("")}
        </div>`;
}

// ── Pitch ─────────────────────────────────────────────────────

function renderPitch(players, events) {
    const rows = new Map();

    players.forEach(p => {
        const line = POSITION_LINE[p.position] ?? 3;
        if (!rows.has(line)) rows.set(line, []);
        rows.get(line).push(p);
    });

    // Attack at top → GK at bottom
    return [...rows.entries()]
        .sort(([a], [b]) => b - a)
        .map(([, row]) => `
            <div class="pitch-row">
                ${row.map(p => renderPitchPlayer(p, events)).join("")}
            </div>`)
        .join("");
}

function renderPitchPlayer(player, events) {
    const armband = player.captain ? "C" : player.viceCaptain ? "VC" : "";
    const badges  = buildBadges(player.id, events);

    return `
    <div class="pitch-player">
        ${badges ? `<div class="pitch-badges">${badges}</div>` : `<div class="pitch-badges"></div>`}
        <div class="pitch-chip${armband ? " pitch-chip--leader" : ""}">
            <span class="pitch-pos">${player.position}</span>
            ${armband ? `<span class="pitch-armband">${armband}</span>` : ""}
        </div>
        <span class="pitch-name">${shortName(player.name)}</span>
    </div>`;
}

// ── Bench ─────────────────────────────────────────────────────

function renderBenchCard(player, events) {
    const armband = player.captain ? "C" : player.viceCaptain ? "VC" : "";
    const badges  = buildBadges(player.id, events);

    return `
    <div class="bench-card">
        <span class="bench-pos">${player.position}</span>
        <span class="bench-name">${shortName(player.name)}</span>
        ${armband ? `<span class="bench-armband">${armband}</span>` : ""}
        ${badges  ? `<span class="bench-badges">${badges}</span>`  : ""}
    </div>`;
}

// ── Event map ─────────────────────────────────────────────────

function buildEventMap(match) {
    const goals   = {};
    const assists = {};
    const yellows = new Set();
    const reds    = new Set();
    const injured = new Set();

    match.goals?.forEach(g => {
        if (typeof g.player === "number")
            goals[g.player] = (goals[g.player] ?? 0) + 1;
    });
    match.assists?.forEach(a => {
        if (typeof a.player === "number")
            assists[a.player] = (assists[a.player] ?? 0) + (a.count ?? 1);
    });
    match.yellowCards?.forEach(c => {
        if (typeof c.player === "number") yellows.add(c.player);
    });
    match.redCards?.forEach(c => {
        if (typeof c.player === "number") reds.add(c.player);
    });
    match.injuries?.forEach(i => {
        if (typeof i.player === "number") injured.add(i.player);
    });

    return { goals, assists, yellows, reds, injured };
}

function buildBadges(id, { goals, assists, yellows, reds, injured }) {
    const parts = [];
    const g = goals[id];
    const a = assists[id];

    if (g)               parts.push(`<span class="pb">${g > 1 ? `<b>${g}</b>` : ""}⚽</span>`);
    if (a)               parts.push(`<span class="pb">${a > 1 ? `<b>${a}</b>` : ""}🎯</span>`);
    if (yellows.has(id)) parts.push(`<span class="pb">🟨</span>`);
    if (reds.has(id))    parts.push(`<span class="pb">🟥</span>`);
    if (injured.has(id)) parts.push(`<span class="pb">🤕</span>`);

    return parts.join("");
}

// ── Helpers ───────────────────────────────────────────────────

function resolveSquad(ids, players) {
    return ids.map(id =>
        players.find(p => p.id === id)
        ?? { id, name: String(id), position: "?", captain: false, viceCaptain: false }
    );
}

function shortName(name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return name;
    const last = parts[parts.length - 1];
    return last.length > 13 ? last.slice(0, 12) + "…" : last;
}
