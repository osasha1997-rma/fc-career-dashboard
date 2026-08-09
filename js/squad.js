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
    const active = players.filter(p => !p.loan);
    const avgOvr = active.length
        ? Math.round(active.reduce((s, p) => s + p.overall, 0) / active.length)
        : 0;
    const gkCount  = active.filter(p => posGroup(p.position) === "GK").length;
    const defCount = active.filter(p => posGroup(p.position) === "DEF").length;
    const midCount = active.filter(p => posGroup(p.position) === "MID").length;
    const fwdCount = active.filter(p => posGroup(p.position) === "FWD").length;

    return `
    <section class="fade">
        <div class="sq-summary">
            <span>👥 ${active.length} Players</span>
            <span>⭐ ${avgOvr} Avg OVR</span>
        </div>
        <div class="sq-depth-bar">
            <span class="sq-depth-item">GK <b>${gkCount}</b></span>
            <span class="sq-depth-item">DEF <b>${defCount}</b></span>
            <span class="sq-depth-item">MID <b>${midCount}</b></span>
            <span class="sq-depth-item">FWD <b>${fwdCount}</b></span>
        </div>

        <div id="sq-tab-body">
            ${renderSquadTab()}
        </div>
    </section>`;
}

function renderSquadTab() {
    return `
        ${createFilterBar()}
        ${createSearchBar("Search players...")}
        <div id="player-list">
            ${renderPlayerList(squadState.players)}
        </div>`;
}

function _removed_renderAdviceTab(players) {
    const active = players.filter(p => !p.loan);

    // ── Depth analysis ────────────────────────────────────────
    const byPos = {};
    for (const p of active) {
        const g = posGroup(p.position);
        if (!byPos[g]) byPos[g] = [];
        byPos[g].push(p);
    }
    const sorted = g => (byPos[g] ?? []).sort((a, b) => b.overall - a.overall);

    const gks  = sorted("GK");
    const defs = sorted("DEF");
    const mids = sorted("MID");
    const fwds = sorted("FWD");

    // depth status per line
    const depthStatus = (count, min, ideal) => {
        if (count < min)   return { cls: "sqa-ds--critical", label: "Critical",  fill: count / ideal };
        if (count < ideal) return { cls: "sqa-ds--low",      label: "Low",       fill: count / ideal };
        return               { cls: "sqa-ds--good",          label: "Good",      fill: 1 };
    };

    // ── Age profile ───────────────────────────────────────────
    const avgAge = active.length
        ? (active.reduce((s, p) => s + (p.age ?? 0), 0) / active.length).toFixed(1)
        : 0;
    const veterans  = active.filter(p => (p.age ?? 0) >= 32).sort((a, b) => b.age - a.age);
    const youngGems = active.filter(p => (p.age ?? 0) <= 22 && p.potential > p.overall)
                            .sort((a, b) => b.potential - a.potential);

    // age band counts
    const u21  = active.filter(p => (p.age ?? 0) <= 21).length;
    const b2126 = active.filter(p => (p.age ?? 0) >= 22 && (p.age ?? 0) <= 26).length;
    const b2731 = active.filter(p => (p.age ?? 0) >= 27 && (p.age ?? 0) <= 31).length;
    const over32 = active.filter(p => (p.age ?? 0) >= 32).length;
    const ageBandTotal = active.length || 1;

    // ── Role balance ──────────────────────────────────────────
    const roleCounts = { Crucial: 0, Important: 0, Rotation: 0, Prospect: 0 };
    for (const p of active) if (roleCounts[p.role] !== undefined) roleCounts[p.role]++;
    const roleTotal = Object.values(roleCounts).reduce((a, b) => a + b, 0) || 1;
    const roleStyle = { Crucial: "#D4AF37", Important: "#60a5fa", Rotation: "#94a3b8", Prospect: "#a78bfa" };

    // ── Development targets ────────────────────────────────────
    const devTargets = active
        .filter(p => p.potential - p.overall >= 5 && (p.age ?? 99) <= 24)
        .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall))
        .slice(0, 5);

    // ── Sell candidates ────────────────────────────────────────
    const sellCandidates = active
        .filter(p => (p.age ?? 0) >= 32 && p.role === "Rotation")
        .sort((a, b) => b.age - a.age)
        .slice(0, 4);

    // ── Helpers ───────────────────────────────────────────────
    const depthMeter = (count, ideal) => {
        const dots = Array.from({ length: ideal }, (_, i) => `<span class="sqa-dot ${i < count ? "sqa-dot--filled" : ""}"></span>`).join("");
        return `<div class="sqa-dots">${dots}${count > ideal ? `<span class="sqa-dot-extra">+${count - ideal}</span>` : ""}</div>`;
    };

    return `<div class="sqa-wrap">

        <!-- Squad Depth -->
        <div class="sqa-block sqa-block--gold">
            <div class="sqa-block-header">
                <span class="sqa-block-title">Squad Depth</span>
                <span class="sqa-block-icon">🧱</span>
            </div>
            <div class="sqa-lines">
                ${[
                    ["GK", "Goalkeepers", gks, 2, 3],
                    ["DEF","Defenders",   defs, 4, 6],
                    ["MID","Midfielders", mids, 4, 6],
                    ["FWD","Forwards",    fwds, 3, 5],
                ].map(([k, label, list, min, ideal]) => {
                    const ds = depthStatus(list.length, min, ideal);
                    return `
                    <div class="sqa-line-row">
                        <div class="sqa-line-left">
                            <span class="sqa-line-pos">${k}</span>
                            <div>
                                <div class="sqa-line-label">${label}</div>
                                <div class="sqa-line-names">${list.slice(0, 2).map(p => p.name.split(" ").slice(-1)[0]).join(", ")}${list.length > 2 ? ` +${list.length - 2}` : ""}</div>
                            </div>
                        </div>
                        <div class="sqa-line-right">
                            ${depthMeter(list.length, ideal)}
                            <span class="sqa-ds ${ds.cls}">${list.length} · ${ds.label}</span>
                        </div>
                    </div>`;
                }).join("")}
            </div>
        </div>

        <!-- Age Profile -->
        <div class="sqa-block sqa-block--blue">
            <div class="sqa-block-header">
                <span class="sqa-block-title">Age Profile</span>
                <span class="sqa-block-icon">📅</span>
            </div>
            <div class="sqa-age-hero">
                <div class="sqa-age-stat">
                    <span class="sqa-age-val">${avgAge}</span>
                    <span class="sqa-age-label">Avg Age</span>
                </div>
                <div class="sqa-age-stat">
                    <span class="sqa-age-val" style="color:#a78bfa">${youngGems.length}</span>
                    <span class="sqa-age-label">Young Gems</span>
                </div>
                <div class="sqa-age-stat">
                    <span class="sqa-age-val" style="color:#f59e0b">${veterans.length}</span>
                    <span class="sqa-age-label">Veterans</span>
                </div>
            </div>
            <div class="sqa-age-bands">
                <div class="sqa-age-band-track">
                    <div class="sqa-age-band-fill" style="width:${u21/ageBandTotal*100}%;background:#a78bfa" title="≤21: ${u21}"></div>
                    <div class="sqa-age-band-fill" style="width:${b2126/ageBandTotal*100}%;background:#22c55e" title="22–26: ${b2126}"></div>
                    <div class="sqa-age-band-fill" style="width:${b2731/ageBandTotal*100}%;background:#60a5fa" title="27–31: ${b2731}"></div>
                    <div class="sqa-age-band-fill" style="width:${over32/ageBandTotal*100}%;background:#f59e0b" title="32+: ${over32}"></div>
                </div>
                <div class="sqa-age-band-legend">
                    <span><span class="sqa-band-dot" style="background:#a78bfa"></span> ≤21 <b>${u21}</b></span>
                    <span><span class="sqa-band-dot" style="background:#22c55e"></span> 22–26 <b>${b2126}</b></span>
                    <span><span class="sqa-band-dot" style="background:#60a5fa"></span> 27–31 <b>${b2731}</b></span>
                    <span><span class="sqa-band-dot" style="background:#f59e0b"></span> 32+ <b>${over32}</b></span>
                </div>
            </div>
            ${veterans.length ? `
            <div class="sqa-vet-title">Veterans — manage minutes carefully</div>
            ${veterans.map(p => `
            <div class="sqa-player-row">
                <span class="sqa-player-name">${p.name}</span>
                <span class="sqa-player-pos">${p.position}</span>
                <span class="sqa-age-badge">${p.age} yrs</span>
                <span class="sqa-role-tag sqa-role-tag--${(p.role||"").toLowerCase()}">${p.role}</span>
            </div>`).join("")}` : ""}
        </div>

        <!-- Development Targets -->
        ${devTargets.length ? `
        <div class="sqa-block sqa-block--purple">
            <div class="sqa-block-header">
                <span class="sqa-block-title">Development Targets</span>
                <span class="sqa-block-icon">🌱</span>
            </div>
            <div class="sqa-dev-subtitle">Highest growth ceiling — prioritise their minutes</div>
            ${devTargets.map((p, i) => {
                const gain = p.potential - p.overall;
                const ovrPct = (p.overall - 50) / 50 * 100;
                const gainPct = gain / 50 * 100;
                return `
            <div class="sqa-dev-card ${i === 0 ? "sqa-dev-card--top" : ""}">
                <div class="sqa-dev-top">
                    <div class="sqa-dev-identity">
                        <span class="sqa-player-pos">${p.position}</span>
                        <span class="sqa-dev-name">${p.name}</span>
                        <span class="sqa-dev-age">Age ${p.age}</span>
                    </div>
                    <div class="sqa-dev-nums">
                        <span class="sqa-dev-ovr">${p.overall}</span>
                        <span class="sqa-dev-arrow">→</span>
                        <span class="sqa-dev-pot">${p.potential}</span>
                        <span class="sqa-gain-badge">+${gain}</span>
                    </div>
                </div>
                <div class="sqa-growth-track">
                    <div class="sqa-growth-base" style="width:${ovrPct}%"></div>
                    <div class="sqa-growth-gain" style="width:${gainPct}%;left:${ovrPct}%"></div>
                </div>
            </div>`; }).join("")}
        </div>` : ""}

        <!-- Role Balance -->
        <div class="sqa-block sqa-block--white">
            <div class="sqa-block-header">
                <span class="sqa-block-title">Role Balance</span>
                <span class="sqa-block-icon">⚖️</span>
            </div>
            <div class="sqa-role-strip">
                ${Object.entries(roleCounts).map(([role, count]) => {
                    const col = roleStyle[role];
                    const pct = Math.round(count / roleTotal * 100);
                    return `
                <div class="sqa-role-block" style="--rc:${col}">
                    <div class="sqa-role-num">${count}</div>
                    <div class="sqa-role-name">${role}</div>
                    <div class="sqa-role-bar"><div class="sqa-role-bar-fill" style="width:${pct}%"></div></div>
                </div>`;
                }).join("")}
            </div>
            <div class="sqa-role-advice">
                ${roleCounts.Crucial < 3 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ Few Crucial players — consider promoting key performers.</div>` : ""}
                ${roleCounts.Prospect > 6 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ High number of Prospects — loan some out for regular football.</div>` : ""}
                ${roleCounts.Rotation < 4 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ Limited rotation options — depth may be stretched over a long season.</div>` : ""}
                ${roleCounts.Crucial >= 5 && roleCounts.Important >= 5 ? `<div class="sqa-advice-item sqa-advice-item--ok">✓ Strong core of key players — well-balanced squad.</div>` : ""}
            </div>
        </div>

        <!-- Sell Candidates -->
        ${sellCandidates.length ? `
        <div class="sqa-block sqa-block--warn">
            <div class="sqa-block-title">📤 Consider Selling</div>
            <div class="sqa-sub-title">Ageing rotation players — may not be worth renewing contracts</div>
            ${sellCandidates.map(p => `
            <div class="sqa-player-row">
                <span class="sqa-player-name">${p.name}</span>
                <span class="sqa-player-pos">${p.position}</span>
                <span class="sqa-player-meta" style="color:#ef4444">Age ${p.age}</span>
                <span class="sqa-player-meta">${p.overall} OVR</span>
            </div>`).join("")}
        </div>` : ""}

    </div>`;
}

function renderPlayerList(players) {
    if (!players.length) return `<div class="sq-empty">No players found.</div>`;

    const loanOut  = players.filter(p => p.loan);
    const active   = players.filter(p => !p.loan);
    const activeFilter = squadState.filter;

    // When a specific position group is active, skip grouping
    if (activeFilter !== "ALL") {
        return active.map(p => createPlayerCard(p)).join("")
            + (loanOut.length ? createPositionGroup("Out on Loan", loanOut) : "");
    }

    // Group active players by position section
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of active) groups[posGroup(p.position)].push(p);

    const activeHtml = ["GK","DEF","MID","FWD"]
        .filter(g => groups[g].length)
        .map(g => createPositionGroup(POS_GROUP[g], groups[g]))
        .join("");

    const loanHtml = loanOut.length
        ? createPositionGroup(`Out on Loan (${loanOut.length})`, loanOut)
        : "";

    return activeHtml + loanHtml;
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
    wireSquadTab(onPlayerSelect);
}

function wireSquadTab(onPlayerSelect) {
    attachSearchListener(text => { squadState.search = text.toLowerCase(); updatePlayerList(); });
    attachFilterListener(f    => { squadState.filter = f;                   updatePlayerList(); });
    document.getElementById("player-list")?.addEventListener("click", e => {
        const card = e.target.closest(".sq-card");
        if (card) onPlayerSelect?.(card.dataset.playerId);
    });
}
