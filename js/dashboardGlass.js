// ==========================================
// CareerOS — Glass Theme Dashboard
// ==========================================

import { getClubLogo } from "./utils/clubLogos.js";

function getHour() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
}

function resultClass(r) {
    return r === "W" ? "win" : r === "D" ? "draw" : "loss";
}

const COMP_META = {
    ucl:     { label: "UEFA Champions League", color: "#60a5fa", bg: "rgba(26,86,219,.35)", icon: "★" },
    laliga:  { label: "La Liga",               color: "#fb923c", bg: "rgba(255,95,0,.35)",  icon: "⬡" },
    default: { label: "CUP",                   color: "#c084fc", bg: "rgba(139,92,246,.35)", icon: "🏆" },
};

function compBadge(comp = "") {
    const key = comp.toLowerCase().replace(/[\s-]/g, "");
    const meta = COMP_META[key] || COMP_META.default;
    return `<span class="gdb-comp-badge" style="color:${meta.color};background:${meta.bg};border-color:${meta.color}30">${meta.icon} ${meta.label}</span>`;
}

function renderHeroCard(season, stats) {
    const logo = "assets/icons/logo.png";
    const goalsFor  = stats.goalsFor  ?? 0;
    const goalsAgainst = stats.goalsAgainst ?? 0;
    const pts = (stats.wins ?? 0) * 3 + (stats.draws ?? 0);

    return `
    <div class="gdb-hero gdb-card">
        <img src="${logo}" class="gdb-hero-bg-logo" alt="">
        <div class="gdb-hero-main">
            <img src="${logo}" class="gdb-hero-logo" alt="${season.club}">
            <div class="gdb-hero-text">
                <div class="gdb-hero-greeting">${getHour()}, Manager</div>
                <div class="gdb-hero-club">${season.club.toUpperCase()}!</div>
                <div class="gdb-hero-meta">${season.competition} &nbsp;·&nbsp; ${season.season}</div>
            </div>
        </div>
        <div class="gdb-hero-strip">
            <div class="gdb-hero-stat">
                <span class="gdb-hero-stat-val">${stats.played ?? 0}</span>
                <span class="gdb-hero-stat-lbl">Played</span>
            </div>
            <div class="gdb-hero-stat">
                <span class="gdb-hero-stat-val">${stats.wins ?? 0}W ${stats.draws ?? 0}D ${stats.losses ?? 0}L</span>
                <span class="gdb-hero-stat-lbl">Record</span>
            </div>
            <div class="gdb-hero-stat">
                <span class="gdb-hero-stat-val">${goalsFor}–${goalsAgainst}</span>
                <span class="gdb-hero-stat-lbl">Goals</span>
            </div>
            <div class="gdb-hero-stat">
                <span class="gdb-hero-stat-val">${pts}</span>
                <span class="gdb-hero-stat-lbl">Points</span>
            </div>
        </div>
    </div>`;
}

function renderNextMatch(season, matches) {
    const next = matches.find(m => !m.result);
    if (!next) return `<div class="gdb-next-match gdb-card"><div class="gdb-card-label">Next Match</div><p class="gdb-empty">No upcoming fixtures</p></div>`;

    const oppLogo  = getClubLogo(next.opponent);
    const clubLogo = "assets/icons/logo.png";

    return `
    <div class="gdb-next-match gdb-card">
        <div class="gdb-card-label">
            Next Match
            <span class="gdb-nm-comp">${next.competition.toUpperCase()}</span>
        </div>
        <div class="gdb-nm-teams">
            <div class="gdb-nm-team">
                <img src="${clubLogo}" class="gdb-nm-crest" alt="${season.club}">
                <span class="gdb-nm-name">${season.club}</span>
            </div>
            <div class="gdb-nm-vs">VS</div>
            <div class="gdb-nm-team">
                ${oppLogo
                    ? `<img src="${oppLogo}" class="gdb-nm-crest" alt="${next.opponent}">`
                    : `<div class="gdb-nm-crest gdb-nm-crest--initial">${next.opponent[0]}</div>`}
                <span class="gdb-nm-name">${next.opponent}</span>
            </div>
        </div>
        <div class="gdb-nm-info">
            ${next.date ? `<span class="gdb-nm-date">${next.date}</span>` : ""}
            <span class="gdb-nm-venue">${next.venue}</span>
        </div>
    </div>`;
}

function renderStatCards(stats, season, players) {
    const morale   = season.teamMorale    ?? "High";
    const training = season.trainingLevel ?? "Excellent";
    const moraleAccent   = ["Very High","High"].includes(morale)   ? "#22c55e" : ["Low","Very Low"].includes(morale)   ? "#ef4444" : "#f59e0b";
    const trainingAccent = ["Excellent","Good"].includes(training) ? "#22c55e" : ["Poor","Bad"].includes(training)    ? "#ef4444" : "#f59e0b";

    const card = (icon, val, lbl, accent = "rgba(255,255,255,.12)") => `
    <div class="gdb-stat-card gdb-card" style="--sc-accent:${accent}">
        <div class="gdb-sc-icon">${icon}</div>
        <div class="gdb-sc-val">${val}</div>
        <div class="gdb-sc-lbl">${lbl}</div>
    </div>`;

    // Season Info card — spans 2 cols × 2 rows
    const captain    = players.find(p => p.captain);
    const viceCap    = players.find(p => p.viceCaptain);
    const formation  = season.formation ?? "—";
    const budget     = season.transferBudget != null
        ? `€${(season.transferBudget / 1e6).toFixed(1)}M`
        : "—";
    const difficulty = season.difficulty ?? "—";
    const window_    = season.transferWindowOpen ? "Open" : "Closed";
    const avgPoss    = stats.avgPossession != null ? `${stats.avgPossession}%` : "—";
    const avgRating  = stats.avgTeamRating  != null ? Number(stats.avgTeamRating).toFixed(2) : "—";

    const playerChip = (p, role) => {
        if (!p) return `<div class="gdb-si-player"><div class="gdb-si-avatar gdb-si-avatar--empty">—</div><div class="gdb-si-pinfo"><span class="gdb-si-prole">${role}</span><span class="gdb-si-pname">Not set</span></div></div>`;
        const src = p.photo || `assets/renders/${p.id}.png`;
        return `
        <div class="gdb-si-player">
            <div class="gdb-si-avatar">
                <img src="${src}" alt="${p.name}" onerror="this.style.display='none'">
            </div>
            <div class="gdb-si-pinfo">
                <span class="gdb-si-prole">${role}</span>
                <span class="gdb-si-pname">${p.name}</span>
            </div>
        </div>`;
    };

    const infoRow = (icon, lbl, val) => `
        <div class="gdb-si-row">
            <span class="gdb-si-icon">${icon}</span>
            <span class="gdb-si-lbl">${lbl}</span>
            <span class="gdb-si-val">${val}</span>
        </div>`;

    const seasonInfoCard = `
    <div class="gdb-card gdb-season-info">
        <div class="gdb-card-label">Season Info</div>
        <div class="gdb-si-players">
            ${playerChip(captain, "Captain")}
            ${playerChip(viceCap, "Vice Captain")}
        </div>
        <div class="gdb-si-grid">
            ${infoRow("🏟️", "Formation",  formation)}
            ${infoRow("💰", "Budget",     budget)}
            ${infoRow("🎯", "Difficulty", difficulty)}
            ${infoRow("🔄", "Transfers",  window_)}
            ${infoRow("⚙️", "Avg Poss",   avgPoss)}
            ${infoRow("📊", "Avg Rating", avgRating)}
        </div>
    </div>`;

    return `
    ${card("⚽", stats.goalsFor ?? 0, "Goals Scored", "#3b82f6")}
    ${card("🛡️", stats.cleanSheets ?? 0, "Clean Sheets", "#8b5cf6")}
    ${card("💬", morale, "Team Morale", moraleAccent)}
    ${card("🏋️", training, "Training", trainingAccent)}
    ${seasonInfoCard}`;
}

function renderRecentMatches(matches) {
    const played = matches.filter(m => m.result).slice(-4).reverse();
    if (!played.length) return `<div class="gdb-card"><div class="gdb-card-label">Recent Matches</div><p class="gdb-empty">No matches yet</p></div>`;

    const rows = played.map(m => {
        const cls  = resultClass(m.result);
        const logo = getClubLogo(m.opponent);
        return `
        <div class="gdb-match-row">
            <div class="gdb-match-accent gdb-match-accent--${cls}"></div>
            <div class="gdb-match-info">
                ${logo ? `<img src="${logo}" class="gdb-match-crest" alt="${m.opponent}">` : `<div class="gdb-match-crest" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;color:rgba(255,255,255,.4)">${m.opponent[0]}</div>`}
                <div class="gdb-match-text">
                    <span class="gdb-match-opp">${m.opponent}</span>
                    ${compBadge(m.competition)}
                </div>
            </div>
            <span class="gdb-match-badge gdb-match-badge--${cls}">${m.result}</span>
            <span class="gdb-match-score gdb-match-score--${cls}">${m.scoreFor}–${m.scoreAgainst}</span>
        </div>`;
    }).join("");

    return `
    <div class="gdb-card gdb-card--full">
        <div class="gdb-card-label">Recent Matches</div>
        ${rows}
        <button class="gdb-view-all" data-screen="matches">View All Matches</button>
    </div>`;
}

function renderTopPerformers(stats, players) {
    const scorer  = stats.topScorer;
    const assists = stats.topAssists;
    const rated   = stats.topRated;

    const rankClass = ["gdb-perf-rank--1","gdb-perf-rank--2","gdb-perf-rank--3"];

    const row = (i, label, p, num, unit) => {
        if (!p?.name) return "";
        const pl     = players.find(pl => pl.name === p.name);
        const avatar = pl
            ? `<img src="${pl.photo || `assets/renders/${pl.id}.png`}" class="gdb-perf-avatar" alt="${p.name}" onerror="this.style.display='none'">`
            : `<div class="gdb-perf-avatar--icon">⚽</div>`;
        return `
        <div class="gdb-perf-row">
            <div class="gdb-perf-rank ${rankClass[i]}"></div>
            <div class="gdb-perf-avatar-wrap">${avatar}</div>
            <div class="gdb-perf-info">
                <span class="gdb-perf-name">${p.name}</span>
                <span class="gdb-perf-label">${label}</span>
            </div>
            <div class="gdb-perf-val">
                <span class="gdb-perf-val-num">${num}</span>
                <span class="gdb-perf-val-unit">${unit}</span>
            </div>
        </div>`;
    };

    return `
    <div class="gdb-card gdb-card--full">
        <div class="gdb-card-label">Top Performers</div>
        ${row(0, "Top Scorer",  scorer,  scorer?.goals   ?? 0, "Goals")}
        ${row(1, "Top Assists", assists, assists?.assists ?? 0, "Assists")}
        ${row(2, "Best Rated",  rated,   rated?.rating   ?? "—", "Avg Rtg")}
        <button class="gdb-view-all" data-screen="squad">View All Players</button>
    </div>`;
}

function renderFormation(season, players) {
    const formation = season.formation ?? "4-3-3";
    const byId = id => players.find(p => p.id === id);

    let gk, lineGroups;

    if (season.startingXI?.length === 11) {
        const xi = season.startingXI.map(byId).filter(Boolean);
        const lines = formation.split("-").map(n => parseInt(n)).filter(n => !isNaN(n));
        let cursor = 0;
        gk = [xi[cursor++]];
        lineGroups = lines.map(n => xi.slice(cursor, cursor += n));
    } else {
        const byName = name => players.find(p => p.name?.toLowerCase().includes(name.toLowerCase().split(" ").at(-1)));
        gk = [byName("Courtois")].filter(Boolean);
        lineGroups = [
            ["Cucurella","Bastoni","Militão","Alexander-Arnold"].map(byName).filter(Boolean),
            ["Rodri","Valverde"].map(byName).filter(Boolean),
            ["Vinícius Júnior","Bellingham","Olise"].map(byName).filter(Boolean),
            ["Mbappé"].map(byName).filter(Boolean),
        ];
    }

    const initial  = p => p?.name?.split(/[\s-]/).find(x => x.length > 1)?.[0]?.toUpperCase() ?? "?";
    const shortName = p => {
        if (!p?.name) return "";
        const n = p.name;
        const aliases = {
            "Vinícius Júnior": "Vinícius", "Vinicius Junior": "Vinicius",
            "Alexander-Arnold": "Trent", "Trent Alexander-Arnold": "Trent",
            "Jude Bellingham": "Bellingham",
        };
        if (aliases[n]) return aliases[n];
        const last = n.split(" ").at(-1).replace(/[.]/g, "");
        return last.length <= 11 ? last : last.slice(0, 10);
    };

    const dot = p => `
        <div class="gdb-f-dot">
            <div class="gdb-f-avatar">${initial(p)}</div>
            <span class="gdb-f-name">${shortName(p)}</span>
            ${p?.overall ? `<span class="gdb-f-ovr">${p.overall}</span>` : ""}
        </div>`;

    const fRow = (ps, top) => `<div class="gdb-f-row" style="top:${top}%">${ps.map(dot).join("")}</div>`;

    // Distribute outfield lines evenly between 12% (attack) and 75% (defence), then GK at 88%
    const n = lineGroups.length;
    const lineRows = [...lineGroups].reverse().map((ps, i) => {
        const top = n === 1 ? 12 : 12 + (i / (n - 1)) * 63;
        return fRow(ps, Math.round(top));
    }).join("");

    return `
    <div class="gdb-card gdb-card--full">
        <div class="gdb-card-label">Team Management <span class="gdb-f-form">${formation}</span></div>
        <div class="gdb-pitch">
            <div class="gdb-pitch-inner">
                <div class="gdb-pitch-halfway"></div>
                <div class="gdb-pitch-circle"></div>
                <div class="gdb-pitch-dot"></div>
                <div class="gdb-pitch-penalty gdb-pitch-penalty--top"></div>
                <div class="gdb-pitch-penalty gdb-pitch-penalty--bot"></div>
                <div class="gdb-pitch-goal gdb-pitch-goal--top"></div>
                <div class="gdb-pitch-goal gdb-pitch-goal--bot"></div>
            </div>
            <div class="gdb-formation">
                ${lineRows}
                ${fRow(gk, 88)}
            </div>
        </div>
        <div style="display:flex;gap:8px;padding:10px 14px 14px">
            <button class="gdb-view-all" data-screen="squad" style="flex:1">Full Squad →</button>
            <button class="gdb-edit-xi" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text-primary);border-radius:8px;padding:8px 12px;cursor:pointer;font-size:13px">Edit XI</button>
        </div>
    </div>`;
}

export function renderDashboardGlass(season, stats, matches = [], players = []) {
    return `
    <div class="gdb-layout">
        ${renderHeroCard(season, stats)}
        <div class="gdb-mid-grid">
            ${renderNextMatch(season, matches)}
            ${renderStatCards(stats, season, players)}
        </div>
        <div class="gdb-bottom-row">
            ${renderRecentMatches(matches)}
            ${renderTopPerformers(stats, players)}
            ${renderFormation(season, players)}
        </div>
    </div>`;
}
