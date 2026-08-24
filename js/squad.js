// ==========================================
// CareerOS — Squad Screen
// ==========================================

import { createPlayerCard, createPositionGroup } from "./components/PlayerCard.js";
import { createSearchBar, attachSearchListener } from "./components/SearchBar.js";
import { createFilterBar, attachFilterListener } from "./components/FilterBar.js";
import { deriveSeasonStats } from "./utils/stats.js";

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

const squadState = { players: [], matches: [], season: {}, search: "", filter: "ALL" };

// ── Render ────────────────────────────────────────────────────

export function renderSquad(players = [], season = {}, matches = []) {
    squadState.players = sortPlayers(players);
    squadState.season  = season;
    squadState.matches = matches;

    return `
    <section class="fade sq-screen">
        <div class="sq-tabs">
            <button class="sq-tab sq-tab--active" data-sq-tab="overview">Overview</button>
            <button class="sq-tab" data-sq-tab="players">Players</button>
            <button class="sq-tab" data-sq-tab="depth-chart">Depth Chart</button>
            <button class="sq-tab" data-sq-tab="stats">Stats</button>
            <button class="sq-tab" data-sq-tab="contracts">Contracts</button>
            <button class="sq-tab" data-sq-tab="development">Development</button>
            <button class="sq-tab" data-sq-tab="roles">Roles</button>
            <button class="sq-tab" data-sq-tab="injuries">Injuries</button>
        </div>
        <div id="sq-tab-body">
            ${renderOverviewTab(players, season)}
        </div>
    </section>`;
}

function renderOverviewTab(players, season) {
    const active  = players.filter(p => !p.loan);
    const loanOut = players.filter(p => p.loan);
    const avgOvr  = active.length
        ? Math.round(active.reduce((s, p) => s + p.overall, 0) / active.length) : 0;

    const gks  = active.filter(p => posGroup(p.position) === "GK");
    const defs = active.filter(p => posGroup(p.position) === "DEF");
    const mids = active.filter(p => posGroup(p.position) === "MID");
    const fwds = active.filter(p => posGroup(p.position) === "FWD");

    const depthScore = Math.min(100, Math.round(
        (Math.min(gks.length,3)/3 + Math.min(defs.length,6)/6 + Math.min(mids.length,6)/6 + Math.min(fwds.length,4)/4) / 4 * 100
    ));
    const depthLabel = depthScore >= 80 ? "Very Strong" : depthScore >= 60 ? "Strong" : depthScore >= 40 ? "Average" : "Weak";
    const depthColor = depthScore >= 80 ? "#22c55e" : depthScore >= 60 ? "#84cc16" : depthScore >= 40 ? "#f59e0b" : "#ef4444";

    const formation = season.formation ?? "4-3-3";

    const posClass = pos => {
        if (pos === "GK") return "sqov-sub-pos--gk";
        if (["LB","CB","RB","LWB","RWB"].includes(pos)) return "sqov-sub-pos--def";
        if (["CDM","CM","CAM","LM","RM"].includes(pos)) return "sqov-sub-pos--mid";
        return "sqov-sub-pos--fwd";
    };

    // Use manager-set XI/subs if stored, otherwise auto-pick by formation
    const byId = id => active.find(p => p.id === id);

    let xi, formationRows, subs;
    if (season.startingXI?.length) {
        xi = season.startingXI.map(byId).filter(Boolean);
        const subList = (season.substitutes ?? []).map(byId).filter(Boolean);
        const xiIds = new Set(xi.map(p => p.id));
        // Build formation rows from the XI order (GK last in array = bottom of pitch)
        formationRows = buildFixedFormationRows(xi, formation);
        subs = subList;
    } else {
        const result = buildFormationXI(active, formation);
        xi = result.xi;
        formationRows = result.formationRows;
        const xiIds = new Set(xi.map(p => p.id));
        subs = [...active].sort((a, b) => b.overall - a.overall).filter(p => !xiIds.has(p.id)).slice(0, 7);
    }

    // Ensure xiIds is defined for downstream use
    const xiIds = new Set(xi.map(p => p.id));

    const totalValue = active.reduce((s, p) => s + (p.marketValue ?? 0), 0);
    const valLabel = totalValue >= 1e9 ? `€${(totalValue/1e9).toFixed(2)}B` : totalValue > 0 ? `€${(totalValue/1e6).toFixed(0)}M` : "—";
    const totalWage = active.reduce((s, p) => s + (p.wage ?? 0), 0);
    const wageLabel = totalWage > 0 ? `£${(totalWage/1000).toFixed(0)}K /wk` : "—";

    return `
    <div class="sqov-stats-bar">
        <div class="sqov-stat-pill">
            <span class="sqov-stat-label">TOTAL PLAYERS</span>
            <span class="sqov-stat-val">${active.length}</span>
        </div>
        <div class="sqov-stat-pill">
            <span class="sqov-stat-label">AVERAGE OVR</span>
            <span class="sqov-stat-val">${avgOvr}</span>
        </div>
        <div class="sqov-stat-pill">
            <span class="sqov-stat-label">TOTAL VALUE</span>
            <span class="sqov-stat-val">${valLabel}</span>
        </div>
        <div class="sqov-stat-pill">
            <span class="sqov-stat-label">SQUAD DEPTH</span>
            <span class="sqov-stat-val" style="color:${depthColor}">${depthLabel}</span>
        </div>
        <div class="sqov-stat-pill">
            <span class="sqov-stat-label">WAGE BUDGET</span>
            <span class="sqov-stat-val">${wageLabel}</span>
        </div>
    </div>

    <div class="sqov-layout">

        <!-- Squad Summary -->
        <div class="sqov-card sqov-summary">
            <div class="sqov-card-title">Squad Summary</div>
            <div class="sqov-total">${active.length}<span>Total Players</span></div>
            <div class="sqov-depth-rows">
                ${[["🧤","Goalkeepers",gks],["🛡️","Defenders",defs],["⚙️","Midfielders",mids],["⚡","Forwards",fwds]].map(([icon,lbl,grp]) => `
                <div class="sqov-depth-row">
                    <span class="sqov-depth-icon">${icon}</span>
                    <span class="sqov-depth-lbl">${lbl}</span>
                    <span class="sqov-depth-num">${grp.length}</span>
                </div>`).join("")}
            </div>
            <div class="sqov-avg-wrap">
                <div class="sqov-avg-info">
                    <span class="sqov-avg-label">Average OVR</span>
                    <span class="sqov-avg-val">${avgOvr}</span>
                </div>
                <div class="sqov-avg-ring">
                    <svg viewBox="0 0 44 44" class="sqov-ring-svg">
                        <circle cx="22" cy="22" r="18" class="sqov-ring-bg"/>
                        <circle cx="22" cy="22" r="18" class="sqov-ring-fill"
                            stroke-dasharray="${(avgOvr / 100 * 113).toFixed(1)} 113"
                            transform="rotate(-90 22 22)"/>
                    </svg>
                    <span class="sqov-ring-val">${avgOvr}</span>
                </div>
            </div>
            <div class="sqov-depth-strip">
                <div class="sqov-card-title" style="margin-bottom:6px">Squad Depth</div>
                <div class="sqov-depth-label" style="color:${depthColor}">${depthLabel}</div>
                <div class="sqov-depth-bar-wrap" style="margin-top:6px">
                    <div class="sqov-depth-bar-fill" style="width:${depthScore}%;background:${depthColor}"></div>
                </div>
                ${loanOut.length ? `<div class="sqov-loan-note" style="margin-top:8px">+${loanOut.length} on loan</div>` : ""}
            </div>
        </div>

        <!-- Starting XI -->
        <div class="sqov-card sqov-xi-card">
            <div class="sqov-card-title" style="display:flex;align-items:center;justify-content:space-between">
                <span>Starting XI <span class="sqov-formation-lbl">${formation}</span></span>
                <button class="sqov-edit-xi-btn">Edit XI</button>
            </div>
            <div class="sqov-xi-pitch">
                ${formationRows}
            </div>
        </div>

    </div>

    <!-- Substitutes — horizontal bottom strip -->
    <div class="sqov-card sqov-subs-bottom">
        <div class="sqov-card-title">Substitutes</div>
        <div class="sqov-subs-strip">
            ${subs.map(p => {
                const src = p.photo || `assets/renders/${p.id}.png`;
                return `
                <div class="sqov-sub-chip" data-player-id="${p.id}">
                    <div class="sqov-sub-avatar">
                        <img src="${src}" alt="${p.name}" onerror="this.style.display='none'">
                    </div>
                    <span class="sqov-sub-ovr">${p.overall}</span>
                    <div class="sqov-sub-info">
                        <div class="sqov-sub-name">${p.name.split(" ").at(-1)}</div>
                        <div class="sqov-sub-pos">${p.position}</div>
                    </div>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

// Slot templates: each entry is an ordered list of preferred positions for that slot.
// Lines are defined left-to-right. Count determines which template to use.
// Renders a fixed XI (array of 11 players, GK first) onto formation rows.
function buildFixedFormationRows(xi, formation) {
    const lines = formation.split("-").map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    const nLines = lines.length;

    // Determine display position label for each line
    const lineDisplayPos = lines.map((_, i) => {
        if (i === 0) return null;                         // DEF: use actual position
        if (i === nLines - 1) return null;                // FWD: use actual position
        const midLines = nLines - 2;
        const midIdx   = i - 1;
        return (midLines >= 2 && midIdx < Math.floor(midLines / 2)) ? "CDM" : null;
    });

    const playerEl = (p, posOverride) => `
        <div class="sqov-xi-player" data-player-id="${p.id}">
            <div class="sqov-xi-avatar">
                <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="${p.name}" onerror="this.style.display='none'">
                <span class="sqov-xi-ovr">${p.overall}</span>
                <div class="sqov-xi-info">
                    <div class="sqov-xi-name">${p.name.split(" ").at(-1)}</div>
                    <div class="sqov-xi-pos">${posOverride ?? p.position}</div>
                </div>
            </div>
        </div>`;

    const gk = xi.slice(0, 1);
    let offset = 1;
    const lineRows = lines.map((n, i) => ({ players: xi.slice(offset, (offset += n, offset)), posOverride: lineDisplayPos[i] }));

    return [...lineRows].reverse().map(({ players, posOverride }) =>
        `<div class="sqov-xi-row">${players.map(p => playerEl(p, posOverride)).join("")}</div>`
    ).join("") + `<div class="sqov-xi-row">${gk.map(p => playerEl(p, null)).join("")}</div>`;
}

const DEF_SLOTS = {
    3: [["CB","LCB"],                ["CB"],                    ["CB","RCB"]],
    4: [["LB","LWB","CB"],           ["CB"],                    ["CB"],           ["RB","RWB","CB"]],
    5: [["LWB","LB"],                ["CB"],                    ["CB"],           ["CB"],           ["RWB","RB"]],
};
const MID_SLOTS = {
    // defensive-mid lines
    cdm: {
        1: [["CDM","CM","CAM"]],
        2: [["CDM","CM"],             ["CDM","CM","CAM"]],
        3: [["CDM","CM"],             ["CDM","CM"],             ["CM","CAM"]],
    },
    // wide/attacking-mid lines
    cam: {
        1: [["CAM","CM","ST"]],
        2: [["LM","LW","CAM"],        ["RM","RW","CAM"]],
        3: [["LM","LW","CAM"],        ["CAM","CM"],             ["RM","RW","CAM"]],
        4: [["LM","LW"],              ["CAM","CM"],             ["CAM","CM"],     ["RM","RW"]],
        5: [["LM","LW"],              ["CAM","CM"],             ["CM","CDM"],     ["CAM","CM"],     ["RM","RW"]],
    },
};
const FWD_SLOTS = {
    1: [["ST","CF","LW","RW","CAM"]],
    2: [["LW","LM","ST","CF"],        ["ST","CF","RW","RM"]],
    3: [["LW","LM","ST"],             ["ST","CF"],              ["RW","RM","ST"]],
};

function buildFormationXI(players, formation) {
    const sorted = [...players].sort((a, b) => b.overall - a.overall);
    const lines  = formation.split("-").map(s => parseInt(s, 10)).filter(n => !isNaN(n));

    const used = new Set();

    // Pick one player for a slot given ordered position preferences
    const pickSlot = prefs => {
        for (const pos of prefs) {
            for (const p of sorted) {
                if (!used.has(p.id) && p.position === pos) {
                    used.add(p.id); return p;
                }
            }
        }
        // fallback: best remaining
        for (const p of sorted) {
            if (!used.has(p.id)) { used.add(p.id); return p; }
        }
        return null;
    };

    const pickLine = slots => slots.map(pickSlot).filter(Boolean);

    // GK
    const gkRow = pickLine([["GK"]]);

    // Defensive line
    const nLines = lines.length;
    const lineRows = lines.map((count, i) => {
        if (i === 0) {
            const slots = DEF_SLOTS[count] ?? Array(count).fill(["CB","LB","RB","LWB","RWB"]);
            return pickLine(slots);
        }
        if (i === nLines - 1) {
            const slots = FWD_SLOTS[count] ?? Array(count).fill(["ST","CF","LW","RW"]);
            return pickLine(slots);
        }
        // Middle lines — earlier = more defensive
        const midLines = nLines - 2;
        const midIdx   = i - 1; // 0-based
        const isCdm    = midLines >= 2 && midIdx < Math.floor(midLines / 2);
        const table    = isCdm ? MID_SLOTS.cdm : MID_SLOTS.cam;
        const slots    = table[count] ?? Array(count).fill(isCdm ? ["CDM","CM"] : ["CAM","CM","LM","RM"]);
        return pickLine(slots);
    });

    const xi = [...gkRow, ...lineRows.flat()];

    const playerEl = p => `
        <div class="sqov-xi-player" data-player-id="${p.id}">
            <div class="sqov-xi-avatar">
                <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="${p.name}" onerror="this.style.display='none'">
                <span class="sqov-xi-ovr">${p.overall}</span>
                <div class="sqov-xi-info">
                    <div class="sqov-xi-name">${p.name.split(" ").at(-1)}</div>
                    <div class="sqov-xi-pos">${p.position}</div>
                </div>
            </div>
        </div>`;

    // Render top-to-bottom: attack → defense → GK
    const formationRows = [...lineRows].reverse().map(row =>
        `<div class="sqov-xi-row">${row.map(playerEl).join("")}</div>`
    ).join("") + `<div class="sqov-xi-row">${gkRow.map(playerEl).join("")}</div>`;

    return { xi, formationRows };
}

function renderSquadTab() {
    const active  = squadState.players.filter(p => !p.loan);
    const loanOut = squadState.players.filter(p => p.loan);
    const allPlayers = [...active, ...loanOut];

    // Derive form (last 5 appearances) from matches
    const played = (squadState.matches ?? []).filter(m => m.result);
    const formMap = {};
    played.slice(-15).forEach(m => {
        const involved = [...(m.startingXI ?? []), ...(m.substitutions ?? []).map(s => s.playerOn)];
        involved.forEach(id => {
            if (!formMap[id]) formMap[id] = [];
            if (formMap[id].length < 5) formMap[id].unshift(m.result);
        });
    });

    const fmtVal  = v => v ? (v >= 1e9 ? `€${(v/1e9).toFixed(1)}B` : `€${(v/1e6).toFixed(0)}M`) : "—";
    const fmtWage = w => w ? `£${(w/1000).toFixed(0)}K` : "—";

    // Build avg rating map from match performances
    const ratingMap = {};
    played.forEach(m => {
        (m.performances ?? []).forEach(perf => {
            if (!ratingMap[perf.player]) ratingMap[perf.player] = [];
            ratingMap[perf.player].push(perf.rating);
        });
    });
    const avgRating = id => {
        const ratings = ratingMap[id];
        if (!ratings?.length) return "—";
        return (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1);
    };

    const formDots = id => {
        const results = formMap[id] ?? [];
        return results.slice(-5).map(r => {
            const cls = r === "W" ? "form-dot--w" : r === "D" ? "form-dot--d" : "form-dot--l";
            return `<span class="form-dot ${cls}"></span>`;
        }).join("") || `<span style="color:rgba(167,183,255,.25);font-size:.65rem">No data</span>`;
    };

    const rows = allPlayers.map((p, i) => {
        const isLoan = !!p.loan;
        const src = p.photo || `assets/renders/${p.id}.png`;
        const potDiff = p.potential && p.potential > p.overall ? `<span class="sq-tbl-pot-diff">+${p.potential - p.overall}</span>` : "";
        return `
        <tr class="sq-tbl-row${isLoan ? " sq-tbl-row--loan" : ""}" data-player-id="${p.id}">
            <td class="sq-tbl-num">${i + 1}</td>
            <td class="sq-tbl-player">
                <img src="${src}" alt="" onerror="this.style.display='none'" class="sq-tbl-avatar">
                <div>
                    <div class="sq-tbl-name">${p.name}</div>
                    <div class="sq-tbl-nat">${p.nationality ?? ""}${isLoan ? ' <span class="sq-loan-tag">LOAN</span>' : ""}</div>
                </div>
            </td>
            <td><span class="sq-tbl-pos-badge">${p.position}</span></td>
            <td class="sq-tbl-num">${p.age ?? "—"}</td>
            <td class="sq-tbl-ovr">${p.overall}</td>
            <td class="sq-tbl-pot">${p.potential ?? "—"}${potDiff}</td>
            <td class="sq-tbl-rating">${avgRating(p.id)}</td>
            <td class="sq-tbl-form">${formDots(p.id)}</td>
            <td class="sq-tbl-val">${fmtVal(p.marketValue)}</td>
            <td class="sq-tbl-val">${fmtWage(p.wage)}/wk</td>
            <td class="sq-tbl-contract">${p.contractEnd ? new Date(p.contractEnd).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</td>
        </tr>`;
    }).join("");

    return `
    <div class="sq-tbl-wrap">
        <div class="sq-tbl-header-bar">
            <span class="sq-tbl-count">All Players (${allPlayers.length})</span>
            <div class="sq-tbl-filters">
                <select class="sq-tbl-filter-sel" id="sq-pos-filter">
                    <option value="ALL">All Positions</option>
                    <option value="GK">Goalkeepers</option>
                    <option value="DEF">Defenders</option>
                    <option value="MID">Midfielders</option>
                    <option value="FWD">Forwards</option>
                </select>
                <input class="sq-tbl-search" id="sq-tbl-search" type="text" placeholder="Search players…">
            </div>
        </div>
        <div class="sq-tbl-scroll">
        <table class="sq-tbl">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Age</th>
                    <th>OVR</th>
                    <th>POT</th>
                    <th>Avg ★</th>
                    <th>Form</th>
                    <th>Value</th>
                    <th>Wage</th>
                    <th>Contract</th>
                </tr>
            </thead>
            <tbody id="sq-tbl-body">${rows}</tbody>
        </table>
        </div>
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
    // Tab switching
    document.querySelectorAll(".sq-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".sq-tab").forEach(b => b.classList.remove("sq-tab--active"));
            btn.classList.add("sq-tab--active");
            const tab = btn.dataset.sqTab;
            const body = document.getElementById("sq-tab-body");
            if (tab === "overview") {
                body.innerHTML = renderOverviewTab(squadState.players, squadState.season ?? {});
                wireOverviewClicks(onPlayerSelect);
            } else if (tab === "players") {
                body.innerHTML = renderSquadTab();
                wireSquadTab(onPlayerSelect);
            } else if (tab === "depth-chart") {
                body.innerHTML = renderDepthChartTab(squadState.players);
            } else if (tab === "stats") {
                body.innerHTML = renderStatsTab(squadState.players, squadState.season ?? {}, squadState.matches ?? []);
            } else if (tab === "contracts") {
                body.innerHTML = renderContractsTab(squadState.players);
            } else if (tab === "development") {
                body.innerHTML = renderDevelopmentTab(squadState.players);
            } else if (tab === "roles") {
                body.innerHTML = renderRolesTab(squadState.players, squadState.season ?? {}, squadState.matches ?? []);
            } else if (tab === "injuries") {
                body.innerHTML = renderInjuriesTab(squadState.players, squadState.season ?? {});
                wireInjuriesTab();
            }
        });
    });

    // Default tab wiring
    wireOverviewClicks(onPlayerSelect);
}

function wireOverviewClicks(onPlayerSelect) {
    document.getElementById("sq-tab-body")?.addEventListener("click", e => {
        if (e.target.closest(".sqov-edit-xi-btn")) {
            window.openXiModal?.();
            return;
        }
        const el = e.target.closest("[data-player-id]");
        if (el) onPlayerSelect?.(el.dataset.playerId);
    });
}

function wireSquadTab(onPlayerSelect) {
    const body = document.getElementById("sq-tbl-body");

    const filterAndRender = () => {
        const pos  = document.getElementById("sq-pos-filter")?.value ?? "ALL";
        const srch = (document.getElementById("sq-tbl-search")?.value ?? "").toLowerCase();
        const all  = [...squadState.players];
        const filtered = all.filter(p => {
            const matchPos  = pos === "ALL" || posGroup(p.position) === pos;
            const matchSrch = !srch || p.name.toLowerCase().includes(srch) || p.position.toLowerCase().includes(srch);
            return matchPos && matchSrch;
        });
        // Re-render just the tbody rows without rebuilding whole tab
        const played = (squadState.matches ?? []).filter(m => m.result);
        const formMap = {};
        played.slice(-15).forEach(m => {
            const involved = [...(m.startingXI ?? []), ...(m.substitutions ?? []).map(s => s.playerOn)];
            involved.forEach(id => { if (!formMap[id]) formMap[id] = []; if (formMap[id].length < 5) formMap[id].unshift(m.result); });
        });
        const fmtVal  = v => v ? (v >= 1e9 ? `€${(v/1e9).toFixed(1)}B` : `€${(v/1e6).toFixed(0)}M`) : "—";
        const fmtWage = w => w ? `£${(w/1000).toFixed(0)}K` : "—";
        const formDots = id => {
            const results = formMap[id] ?? [];
            return results.slice(-5).map(r => `<span class="form-dot form-dot--${r.toLowerCase()}"></span>`).join("") || `<span style="color:rgba(167,183,255,.25);font-size:.65rem">No data</span>`;
        };
        if (body) body.innerHTML = filtered.map((p, i) => {
            const isLoan = !!p.loan;
            const src = p.photo || `assets/renders/${p.id}.png`;
            const potDiff = p.potential && p.potential > p.overall ? `<span class="sq-tbl-pot-diff">+${p.potential - p.overall}</span>` : "";
            return `<tr class="sq-tbl-row${isLoan ? " sq-tbl-row--loan" : ""}" data-player-id="${p.id}">
                <td class="sq-tbl-num">${i + 1}</td>
                <td class="sq-tbl-player"><img src="${src}" alt="" onerror="this.style.display='none'" class="sq-tbl-avatar"><div><div class="sq-tbl-name">${p.name}</div><div class="sq-tbl-nat">${p.nationality ?? ""}${isLoan ? ' <span class="sq-loan-tag">LOAN</span>' : ""}</div></div></td>
                <td><span class="sq-tbl-pos-badge">${p.position}</span></td>
                <td class="sq-tbl-num">${p.age ?? "—"}</td>
                <td class="sq-tbl-ovr">${p.overall}</td>
                <td class="sq-tbl-pot">${p.potential ?? "—"}${potDiff}</td>
                <td class="sq-tbl-form">${formDots(p.id)}</td>
                <td class="sq-tbl-val">${fmtVal(p.marketValue)}</td>
                <td class="sq-tbl-val">${fmtWage(p.wage)}/wk</td>
                <td class="sq-tbl-contract">${p.contractEnd ? new Date(p.contractEnd).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</td>
            </tr>`;
        }).join("");
    };

    document.getElementById("sq-pos-filter")?.addEventListener("change", filterAndRender);
    document.getElementById("sq-tbl-search")?.addEventListener("input", filterAndRender);

    document.getElementById("sq-tbl-body")?.addEventListener("click", e => {
        const row = e.target.closest("[data-player-id]");
        if (row) onPlayerSelect?.(row.dataset.playerId);
    });
}

// ── Depth Chart Tab ───────────────────────────────────────────

function renderDepthChartTab(players) {
    const active = players.filter(p => !p.loan);

    const sections = [
        { label: "STRIKER",            positions: ["ST","CF"] },
        { label: "LEFT WING",          positions: ["LW"] },
        { label: "RIGHT WING",         positions: ["RW"] },
        { label: "ATTACKING MID",      positions: ["CAM"] },
        { label: "LEFT MID",           positions: ["LM"] },
        { label: "RIGHT MID",          positions: ["RM"] },
        { label: "CENTRAL MID",        positions: ["CM"] },
        { label: "DEFENSIVE MID",      positions: ["CDM"] },
        { label: "LEFT BACK",          positions: ["LB","LWB"] },
        { label: "RIGHT BACK",         positions: ["RB","RWB"] },
        { label: "CENTRE BACK",        positions: ["CB"] },
        { label: "GOALKEEPER",         positions: ["GK"] },
    ];

    const choiceLabel = i => i === 0 ? "1ST" : i === 1 ? "2ND" : i === 2 ? "3RD" : `${i+1}TH`;

    const strength = candidates => {
        if (!candidates.length) return null;
        const avg = Math.round(candidates.reduce((s,p) => s + p.overall, 0) / candidates.length);
        if (avg >= 88) return { label: "Excellent",   color: "#22c55e" };
        if (avg >= 84) return { label: "Very Strong", color: "#84cc16" };
        if (avg >= 80) return { label: "Strong",      color: "#f59e0b" };
        if (avg >= 76) return { label: "Average",     color: "#f97316" };
        return             { label: "Weak",        color: "#ef4444" };
    };

    const playerCard = (p, rank) => {
        const src = p.photo || `assets/renders/${p.id}.png`;
        return `
        <div class="dc2-card">
            <div class="dc2-rank">${rank}</div>
            <div class="dc2-portrait">
                <img src="${src}" alt="${p.name}" onerror="this.style.display='none'">
                <div class="dc2-ovr-badge">${p.overall}</div>
            </div>
            <div class="dc2-info">
                <div class="dc2-name">${p.name.split(" ").slice(-1)[0]}</div>
                <div class="dc2-meta">${p.position} · ${p.age ?? "?"} yrs</div>
            </div>
        </div>`;
    };

    const sectionsHtml = sections.map(sec => {
        const candidates = active
            .filter(p => sec.positions.includes(p.position) || (p.secondaryPositions ?? []).some(sp => sec.positions.includes(sp)))
            .sort((a,b) => b.overall - a.overall);

        if (!candidates.length) return "";

        const str = strength(candidates);
        const avgOvr = Math.round(candidates.reduce((s,p) => s + p.overall, 0) / candidates.length);

        const cards = candidates.map((p, i) => playerCard(p, choiceLabel(i))).join("");

        return `
        <div class="dc2-section">
            <div class="dc2-section-header">
                <span class="dc2-section-title">${sec.label}</span>
                <span class="dc2-section-strength" style="color:${str.color}">${str.label}</span>
                <span class="dc2-section-avg">${avgOvr} avg OVR</span>
            </div>
            <div class="dc2-cards">${cards}</div>
        </div>`;
    }).join("");

    return `<div class="dc2-wrap">${sectionsHtml}</div>`;
}

// ── Stats Tab ─────────────────────────────────────────────────

function renderStatsTab(players, season, matches) {
    const played = matches.filter(m => m.result);

    // Aggregate from match data
    const wins         = played.filter(m => m.result === "W").length;
    const draws        = played.filter(m => m.result === "D").length;
    const losses       = played.filter(m => m.result === "L").length;
    const goalsFor     = played.reduce((s, m) => s + (m.scoreFor ?? 0), 0);
    const goalsAgainst = played.reduce((s, m) => s + (m.scoreAgainst ?? 0), 0);
    const cleanSheets  = played.filter(m => (m.scoreAgainst ?? 1) === 0).length;
    const yellowCards  = played.reduce((s, m) => s + (m.yellowCards?.length ?? 0), 0);
    const winRate      = played.length ? Math.round(wins / played.length * 100) : null;

    const posMatches   = played.filter(m => m.teamStats?.possession != null);
    const avgPossession = posMatches.length ? Math.round(posMatches.reduce((s, m) => s + m.teamStats.possession, 0) / posMatches.length) : null;
    const passMatches  = played.filter(m => m.teamStats?.passAccuracy != null);
    const avgPass      = passMatches.length ? Math.round(passMatches.reduce((s, m) => s + m.teamStats.passAccuracy, 0) / passMatches.length) : null;
    const shotMatches  = played.filter(m => m.teamStats?.shots != null);
    const avgShots     = shotMatches.length ? (shotMatches.reduce((s, m) => s + m.teamStats.shots, 0) / shotMatches.length).toFixed(1) : null;

    // Per-player goal/assist totals from match data
    const goalMap = {}, assistMap = {};
    played.forEach(m => {
        m.goals?.forEach(g => { if (typeof g.player === "number") goalMap[g.player] = (goalMap[g.player] ?? 0) + 1; });
        m.assists?.forEach(a => { if (typeof a.player === "number") assistMap[a.player] = (assistMap[a.player] ?? 0) + (a.count ?? 1); });
    });

    const byId = id => players.find(p => p.id === Number(id));

    const topScorers = Object.entries(goalMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([id, g]) => ({ player: byId(id), goals: g })).filter(x => x.player);

    const topAssists = Object.entries(assistMap)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([id, a]) => ({ player: byId(id), assists: a })).filter(x => x.player);

    const stat = (label, val, color) => `
    <div class="sqst-card">
        <div class="sqst-val" ${color ? `style="color:${color}"` : ""}>${val ?? "—"}</div>
        <div class="sqst-label">${label}</div>
    </div>`;

    const playerRow = (p, val, icon) => `
    <div class="sqst-player-row">
        <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="${p.name}" onerror="this.style.display='none'" class="sqst-avatar">
        <span class="sqst-player-name">${p.name.split(" ").slice(-1)[0]}</span>
        <span class="sqst-player-pos">${p.position}</span>
        <span class="sqst-player-val">${icon} ${val}</span>
    </div>`;

    return `
    <div class="sqst-wrap">
        <div class="sqst-section-title">TEAM STATISTICS</div>
        <div class="sqst-grid">
            ${stat("Matches Played", played.length)}
            ${stat("Wins", wins, "#22c55e")}
            ${stat("Draws", draws, "#f59e0b")}
            ${stat("Losses", losses, "#ef4444")}
            ${stat("Goals For", goalsFor)}
            ${stat("Goals Against", goalsAgainst)}
            ${stat("Win Rate", winRate != null ? `${winRate}%` : null)}
            ${stat("Pass Accuracy", avgPass != null ? `${avgPass}%` : null)}
            ${stat("Possession", avgPossession != null ? `${avgPossession}%` : null)}
            ${stat("Shots / Game", avgShots)}
            ${stat("Clean Sheets", cleanSheets)}
            ${stat("Yellow Cards", yellowCards)}
        </div>
        <div class="sqst-leaderboards">
            <div class="sqst-board">
                <div class="sqst-board-title">TOP SCORERS</div>
                ${topScorers.length ? topScorers.map(({ player: p, goals }) => playerRow(p, goals, "⚽")).join("") : `<div class="sqst-empty">No goal data</div>`}
            </div>
            <div class="sqst-board">
                <div class="sqst-board-title">TOP ASSISTS</div>
                ${topAssists.length ? topAssists.map(({ player: p, assists }) => playerRow(p, assists, "🎯")).join("") : `<div class="sqst-empty">No assist data</div>`}
            </div>
        </div>
    </div>`;
}

// ── Contracts Tab ─────────────────────────────────────────────

function renderContractsTab(players) {
    // Use last played match date as in-game "today"
    const playedMatches = (squadState.matches ?? [])
        .filter(m => m.result && m.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const gameDate = playedMatches.length ? new Date(playedMatches[0].date) : new Date();

    const parseEnd = (p) => p.contractEnd ? new Date(p.contractEnd) : null;

    const fmtDate = (d) => d ? d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—";

    const monthsFromGame = (endDate) =>
        (endDate.getFullYear() - gameDate.getFullYear()) * 12 + (endDate.getMonth() - gameDate.getMonth());

    const statusChip = (endDate) => {
        if (!endDate) return `<span class="sqct-chip sqct-chip--unknown">Unknown</span>`;
        const m = monthsFromGame(endDate);
        if (m <= 6)  return `<span class="sqct-chip sqct-chip--expiring">Expiring</span>`;
        if (m <= 18) return `<span class="sqct-chip sqct-chip--soon">Expires Soon</span>`;
        return `<span class="sqct-chip sqct-chip--ok">Contracted</span>`;
    };

    const active = [...players.filter(p => !p.loan)].sort((a, b) => {
        const ae = parseEnd(a); const be = parseEnd(b);
        if (!ae && !be) return 0;
        if (!ae) return 1;
        if (!be) return -1;
        return ae - be;
    });

    const fmt = (v, prefix="£") => v ? `${prefix}${(v/1000).toFixed(0)}K` : "—";
    const fmtM = (v) => v ? (v >= 1e9 ? `€${(v/1e9).toFixed(1)}B` : `€${(v/1e6).toFixed(0)}M`) : "—";

    const rows = active.map(p => {
        const endDate = parseEnd(p);
        return `
    <tr class="sqct-row">
        <td class="sqct-player">
            <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="" onerror="this.style.display='none'" class="sqct-avatar">
            <div>
                <div class="sqct-name">${p.name}</div>
                <div class="sqct-pos">${p.position}</div>
            </div>
        </td>
        <td class="sqct-ovr">${p.overall}</td>
        <td class="sqct-age">${p.age ?? "—"}</td>
        <td class="sqct-wage">${fmt(p.wage)}/wk</td>
        <td class="sqct-value">${fmtM(p.marketValue)}</td>
        <td class="sqct-end">${fmtDate(endDate)}</td>
        <td>${statusChip(endDate)}</td>
    </tr>`; }).join("");

    const totalWage = active.reduce((s, p) => s + (p.wage ?? 0), 0);
    const expiring = active.filter(p => {
        const e = parseEnd(p);
        if (!e) return false;
        return monthsFromGame(e) <= 6;
    }).length;

    return `
    <div class="sqct-wrap">
        <div class="sqct-summary">
            <div class="sqct-sum-pill"><div class="sqct-sum-val">£${(totalWage/1000).toFixed(0)}K</div><div class="sqct-sum-label">WEEKLY WAGE BILL</div></div>
            <div class="sqct-sum-pill"><div class="sqct-sum-val" style="color:#ef4444">${expiring}</div><div class="sqct-sum-label">EXPIRING CONTRACTS</div></div>
            <div class="sqct-sum-pill"><div class="sqct-sum-val">${active.length}</div><div class="sqct-sum-label">TOTAL PLAYERS</div></div>
        </div>
        <div class="sqct-table-wrap">
        <table class="sqct-table">
            <thead>
                <tr>
                    <th>Player</th><th>OVR</th><th>Age</th><th>Weekly Wage</th><th>Market Value</th><th>Contract End</th><th>Status</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
    </div>`;
}

// ── Development Tab ───────────────────────────────────────────

function renderDevelopmentTab(players) {
    const active = players.filter(p => !p.loan);
    const withPot = active.filter(p => p.potential && p.potential > p.overall);

    const topProspects = [...withPot]
        .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall))
        .slice(0, 8);

    const topOvr = [...active].sort((a,b) => b.overall - a.overall).slice(0, 5);

    const potBar = (ovr, pot) => {
        const max = Math.max(pot, 99);
        const ovrPct = (ovr / max * 100).toFixed(1);
        const potPct = (pot / max * 100).toFixed(1);
        return `
        <div class="sqdev-bar-wrap">
            <div class="sqdev-bar-bg">
                <div class="sqdev-bar-pot" style="width:${potPct}%"></div>
                <div class="sqdev-bar-ovr" style="width:${ovrPct}%"></div>
            </div>
            <span class="sqdev-bar-labels"><span>${ovr} OVR</span><span style="color:#a78bfa">${pot} POT</span></span>
        </div>`;
    };

    const prospectCards = topProspects.map(p => `
    <div class="sqdev-card">
        <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="${p.name}" onerror="this.style.display='none'" class="sqdev-avatar">
        <div class="sqdev-info">
            <div class="sqdev-name">${p.name}</div>
            <div class="sqdev-meta">${p.position} · ${p.age ?? "?"} yrs</div>
            ${potBar(p.overall, p.potential)}
        </div>
        <div class="sqdev-gap">+${p.potential - p.overall}</div>
    </div>`).join("");

    const keyPlayers = topOvr.map(p => `
    <div class="sqdev-key-row">
        <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="" onerror="this.style.display='none'" class="sqdev-avatar sqdev-avatar--sm">
        <span class="sqdev-name">${p.name.split(" ").slice(-1)[0]}</span>
        <span class="sqdev-pos">${p.position}</span>
        <span class="sqdev-ovr">${p.overall}</span>
    </div>`).join("");

    return `
    <div class="sqdev-wrap">
        <div class="sqdev-col">
            <div class="sqdev-section-title">DEVELOPMENT PROSPECTS</div>
            <div class="sqdev-cards">${prospectCards || `<div class="sqst-empty">No prospects with growth potential found</div>`}</div>
        </div>
        <div class="sqdev-col sqdev-col--right">
            <div class="sqdev-section-title">KEY PLAYERS</div>
            <div class="sqdev-key-list">${keyPlayers}</div>
            <div class="sqdev-section-title" style="margin-top:24px">SQUAD OVERVIEW</div>
            <div class="sqdev-overview-grid">
                <div class="sqdev-ov-item"><div class="sqdev-ov-val">${withPot.length}</div><div class="sqdev-ov-label">With Potential</div></div>
                <div class="sqdev-ov-item"><div class="sqdev-ov-val">${active.filter(p => (p.age??99) <= 21).length}</div><div class="sqdev-ov-label">U21 Players</div></div>
                <div class="sqdev-ov-item"><div class="sqdev-ov-val">${active.filter(p => (p.potential??0) >= 90).length}</div><div class="sqdev-ov-label">90+ Potential</div></div>
                <div class="sqdev-ov-item"><div class="sqdev-ov-val">${active.filter(p => p.overall >= 88).length}</div><div class="sqdev-ov-label">Elite (88+ OVR)</div></div>
            </div>
        </div>
    </div>`;
}

// ── Roles Tab ─────────────────────────────────────────────────

function renderRolesTab(players, season, matches) {
    const active = players.filter(p => !p.loan);
    const byId   = id => active.find(p => p.id === Number(id));
    const sorted = [...active].sort((a,b) => b.overall - a.overall);
    const gks    = active.filter(p => p.position === "GK").sort((a,b) => b.overall - a.overall);
    const outfield = sorted.filter(p => p.position !== "GK");

    // Captain from season data
    const captainP    = (season.captainId ? byId(season.captainId) : null) ?? sorted[0];
    const viceP       = (season.viceCaptainId ? byId(season.viceCaptainId) : null) ?? sorted[1];
    const thirdP      = sorted.find(p => p.id !== captainP?.id && p.id !== viceP?.id);

    // Derive penalty/freekick takers from most goals/assists in matches
    const goalMap = {}, assistMap = {};
    matches.filter(m => m.result).forEach(m => {
        m.goals?.forEach(g => { if (typeof g.player === "number") goalMap[g.player] = (goalMap[g.player] ?? 0) + 1; });
        m.assists?.forEach(a => { if (typeof a.player === "number") assistMap[a.player] = (assistMap[a.player] ?? 0) + (a.count ?? 1); });
    });

    const topByGoals   = [...outfield].sort((a,b) => (goalMap[b.id]??0) - (goalMap[a.id]??0));
    const topByAssists = [...outfield].sort((a,b) => (assistMap[b.id]??0) - (assistMap[a.id]??0));

    const chip = (p, label, sub) => p ? `
    <div class="sqrl-chip">
        <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="" onerror="this.style.display='none'" class="sqrl-avatar">
        <div>
            <div class="sqrl-chip-name">${p.name.split(" ").slice(-1)[0]}</div>
            <div class="sqrl-chip-label">${label}${sub ? ` <span style="color:rgba(167,183,255,.4);font-size:.58rem">${sub}</span>` : ""}</div>
        </div>
    </div>` : "";

    return `
    <div class="sqrl-wrap">
        <div class="sqrl-block">
            <div class="sqrl-block-title">CAPTAINS</div>
            <div class="sqrl-chips">
                ${chip(captainP, "Captain", `${captainP?.overall} OVR`)}
                ${chip(viceP, "Vice Captain", `${viceP?.overall} OVR`)}
                ${chip(thirdP, "3rd Captain", `${thirdP?.overall} OVR`)}
            </div>
        </div>
        <div class="sqrl-block">
            <div class="sqrl-block-title">PENALTY TAKERS</div>
            <div class="sqrl-chips">
                ${chip(topByGoals[0], "1st Choice", goalMap[topByGoals[0]?.id] ? `${goalMap[topByGoals[0].id]} goals` : null)}
                ${chip(topByGoals[1], "2nd Choice", goalMap[topByGoals[1]?.id] ? `${goalMap[topByGoals[1].id]} goals` : null)}
            </div>
        </div>
        <div class="sqrl-block">
            <div class="sqrl-block-title">FREE KICK TAKERS</div>
            <div class="sqrl-chips">
                ${chip(topByAssists[0], "1st Choice", assistMap[topByAssists[0]?.id] ? `${assistMap[topByAssists[0].id]} assists` : null)}
                ${chip(topByAssists[1], "2nd Choice", assistMap[topByAssists[1]?.id] ? `${assistMap[topByAssists[1].id]} assists` : null)}
            </div>
        </div>
        <div class="sqrl-block">
            <div class="sqrl-block-title">CORNER TAKERS</div>
            <div class="sqrl-chips">
                ${chip(topByAssists[0], "1st Choice")}
                ${chip(topByAssists[2], "2nd Choice")}
            </div>
        </div>
        <div class="sqrl-block">
            <div class="sqrl-block-title">GOALKEEPER</div>
            <div class="sqrl-chips">
                ${chip(gks[0], "1st Choice", `${gks[0]?.overall} OVR`)}
                ${chip(gks[1] ?? null, "2nd Choice", gks[1] ? `${gks[1].overall} OVR` : null)}
            </div>
        </div>
    </div>`;
}

// ── Injuries Tab ────────────────────────────────────────────────────────────
function renderInjuriesTab(players, season) {
    const byId = id => players.find(p => p.id === id);
    const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

    // Derive injuries from match history
    const matchInjuries = [];
    const recoveredSet = new Set((season.injuries ?? []).filter(i => i.status === "recovered").map(i => `${i.playerId}_${i.date}`));
    for (const m of (squadState.matches ?? []).filter(m => m.result)) {
        for (const inj of (m.injuries ?? [])) {
            const key = `${inj.player}_${m.date?.slice(0,10)}`;
            matchInjuries.push({
                playerId: inj.player,
                type: inj.type ?? "Unknown",
                date: m.date?.slice(0,10) ?? null,
                daysOut: inj.daysOut ?? null,
                expectedReturn: inj.expectedReturn ?? null,
                opponent: m.opponent,
                source: "match",
                status: recoveredSet.has(key) ? "recovered" : "injured",
                key,
            });
        }
    }

    // Manual injuries from season.injuries (exclude match-derived ones we already have)
    const manualInjuries = (season.injuries ?? []).filter(i => i.source !== "match");

    // Merge: manual entries + match-derived
    const allInjuries = [...manualInjuries, ...matchInjuries].sort((a, b) => {
        if (a.status === b.status) return new Date(b.date) - new Date(a.date);
        return a.status === "injured" ? -1 : 1;
    });

    const rows = allInjuries.length ? allInjuries.map((inj, idx) => {
        const p = byId(inj.playerId);
        if (!p) return "";
        const isActive = inj.status !== "recovered";
        const returnInfo = inj.daysOut ? `~${inj.daysOut}d out` : fmtDate(inj.expectedReturn);
        const fromMatch = inj.source === "match";
        return `
        <tr class="inj-row${isActive ? "" : " inj-row--recovered"}">
            <td class="sq-tbl-player" style="padding:10px 8px">
                <div class="sq-tbl-name">${p.name}</div>
                <div class="sq-tbl-nat" style="font-size:.7rem;opacity:.6">${p.position ?? ""}${fromMatch ? ` · vs ${inj.opponent}` : ""}</div>
            </td>
            <td>${inj.type}</td>
            <td>${fmtDate(inj.date)}</td>
            <td>${returnInfo}</td>
            <td><span class="inj-status ${isActive ? "inj-status--active" : "inj-status--ok"}">${isActive ? "Injured" : "Recovered"}</span></td>
            <td>
                ${isActive ? `<button class="inj-btn inj-btn--recover" data-inj-idx="${idx}" data-inj-key="${inj.key ?? ""}" data-inj-source="${inj.source ?? "manual"}">✓ Recovered</button>` : ""}
            </td>
        </tr>`;
    }).join("") : `<tr><td colspan="6" style="text-align:center;padding:32px;opacity:.5">No injuries recorded</td></tr>`;

    return `
    <div class="inj-wrap">
        <div class="inj-toolbar">
            <span class="inj-count">${allInjuries.filter(i => i.status !== "recovered").length} Active · ${allInjuries.length} Total</span>
            <button class="inj-btn inj-btn--add" id="inj-add-btn">+ Add Injury</button>
        </div>
        <div class="sq-tbl-scroll">
        <table class="sq-tbl">
            <thead><tr>
                <th>Player</th>
                <th>Type</th>
                <th>Date</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
    </div>

    <!-- Add Injury Modal -->
    <div id="inj-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center">
        <div style="background:var(--card-bg,#1a1f2e);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:24px;width:340px;max-width:90vw">
            <h3 style="margin:0 0 16px;font-size:1rem">Add Injury</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
                <select id="inj-player-sel" class="xi-select">
                    <option value="">— Select player —</option>
                    ${players.map(p => `<option value="${p.id}">${p.name} (${p.position ?? "?"})</option>`).join("")}
                </select>
                <input id="inj-type" class="xi-select" placeholder="Injury type (e.g. Hamstring)" style="padding:8px 10px">
                <label style="font-size:.75rem;opacity:.6">Injury Date</label>
                <input id="inj-date" type="date" class="xi-select">
                <label style="font-size:.75rem;opacity:.6">Expected Return</label>
                <input id="inj-return" type="date" class="xi-select">
            </div>
            <div style="display:flex;gap:8px;margin-top:16px">
                <button id="inj-modal-cancel" class="modal-btn modal-btn--ghost" style="flex:1">Cancel</button>
                <button id="inj-modal-save" class="modal-btn modal-btn--primary" style="flex:1">Save</button>
            </div>
        </div>
    </div>`;
}

function wireInjuriesTab() {
    const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:4000/api" : "https://fc-career-dashboard.onrender.com/api";

    const saveInjuries = async (injuries) => {
        const careerId = window._careerId;
        if (!careerId) return;
        await fetch(`${apiBase}/careers/${careerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "season.injuries": injuries }),
        });
        squadState.season.injuries = injuries;
    };

    // Recover button
    document.querySelector(".inj-wrap")?.addEventListener("click", async e => {
        const recoverBtn = e.target.closest(".inj-btn--recover");
        if (recoverBtn) {
            const source = recoverBtn.dataset.injSource;
            const injuries = (squadState.season.injuries ?? []).slice();
            if (source === "match") {
                // For match injuries, record recovery in season.injuries by key
                const key = recoverBtn.dataset.injKey;
                const existing = injuries.find(i => i.key === key);
                if (existing) {
                    existing.status = "recovered";
                    existing.recoveredDate = new Date().toISOString().slice(0, 10);
                } else {
                    injuries.push({ key, source: "match", status: "recovered", recoveredDate: new Date().toISOString().slice(0, 10) });
                }
            } else {
                const idx = parseInt(recoverBtn.dataset.injIdx);
                const manualInjuries = injuries.filter(i => i.source !== "match");
                if (manualInjuries[idx]) {
                    manualInjuries[idx].status = "recovered";
                    manualInjuries[idx].recoveredDate = new Date().toISOString().slice(0, 10);
                }
            }
            await saveInjuries(injuries);
            document.getElementById("sq-tab-body").innerHTML = renderInjuriesTab(squadState.players, squadState.season);
            wireInjuriesTab();
        }
    });

    // Add injury modal open
    document.getElementById("inj-add-btn")?.addEventListener("click", () => {
        document.getElementById("inj-date").value = new Date().toISOString().slice(0, 10);
        document.getElementById("inj-modal").style.display = "flex";
    });

    // Add injury modal close
    document.getElementById("inj-modal-cancel")?.addEventListener("click", () => {
        document.getElementById("inj-modal").style.display = "none";
    });

    // Save new injury
    document.getElementById("inj-modal-save")?.addEventListener("click", async () => {
        const playerId = parseInt(document.getElementById("inj-player-sel").value);
        const type     = document.getElementById("inj-type").value.trim();
        const date     = document.getElementById("inj-date").value;
        const ret      = document.getElementById("inj-return").value;
        if (!playerId || !type || !date) { alert("Player, type and date are required."); return; }

        const injuries = (squadState.season.injuries ?? []).slice();
        injuries.push({ playerId, type, date, expectedReturn: ret || null, status: "injured" });
        await saveInjuries(injuries);
        document.getElementById("inj-modal").style.display = "none";
        document.getElementById("sq-tab-body").innerHTML = renderInjuriesTab(squadState.players, squadState.season);
        wireInjuriesTab();
    });
}
