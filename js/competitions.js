// ==========================================
// CareerOS — Competitions
// ==========================================

import { getCompetitionLabel, getCompetitionColor } from "./utils/competitions.js";
import { getClubLogo } from "./utils/clubLogos.js";
import { getPlayerName } from "./utils/players.js";

const COMP_ORDER = ["laliga", "ucl", "copadelrey", "clubworldcup", "supercopa"];

let _matches     = [];
let _standings   = {};
let _leagueStats = {};
let _activeComp  = "laliga";
let _activeTab   = "table";
let _activeStat  = "scorers";

export function createCompetitions(matches = [], standings = {}, leagueStats = {}) {
    _matches     = matches;
    _standings   = standings;
    _leagueStats = leagueStats;

    const available = COMP_ORDER.filter(c =>
        matches.some(m => m.competition === c) || (standings[c]?.length > 0)
    );
    if (!available.includes(_activeComp)) _activeComp = available[0] ?? "laliga";

    return `
    <section class="cp-page fade">
        <div class="page-header">
            <h1>Competitions</h1>
            <p>Season 2027/28</p>
        </div>
        <div class="cp-comp-tabs" id="cp-comp-tabs">
            ${available.map(c => {
                const cc = getCompetitionColor(c);
                return `<button class="cp-comp-tab${c === _activeComp ? " active" : ""}"
                    data-comp="${c}" style="--cc:${cc.text}">
                    ${getCompetitionLabel(c)}
                </button>`;
            }).join("")}
        </div>
        <div id="cp-content">${renderCompContent(_activeComp)}</div>
    </section>`;
}

// ── Content for one competition ─────────────────────────────────────────────

function renderCompContent(comp) {
    const all      = _matches.filter(m => m.competition === comp);
    const results  = all.filter(m => m.result).sort((a, b) => b.id - a.id);
    const fixtures = all.filter(m => !m.result).sort((a, b) => a.id - b.id);
    const table    = _standings[comp] ?? [];
    const tabs     = table.length ? ["table","results","fixtures","stats"] : ["results","fixtures","stats"];
    if (!tabs.includes(_activeTab)) _activeTab = tabs[0];

    return `
    <div class="cp-sub-tabs" id="cp-sub-tabs">
        ${tabs.map(t => `
        <button class="cp-sub-tab${t === _activeTab ? " active" : ""}" data-tab="${t}">
            ${t[0].toUpperCase() + t.slice(1)}
        </button>`).join("")}
    </div>
    <div class="cp-tab-body" id="cp-tab-body">
        ${renderTab(_activeTab, comp, results, fixtures, table)}
    </div>`;
}

function renderTab(tab, comp, results, fixtures, table) {
    switch (tab) {
        case "table":    return renderTable(table, comp);
        case "results":  return renderResults(results);
        case "fixtures": return renderFixtures(fixtures);
        case "stats":    return renderStats(comp, results);
        default:         return "";
    }
}

// ── Table ───────────────────────────────────────────────────────────────────

function renderTable(table, comp) {
    if (!table.length) return `<div class="cp-empty">No standings data yet</div>`;
    const cc = getCompetitionColor(comp);
    return `
    <div class="cp-table-wrap">
        <table class="cp-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th class="cp-th-team">Club</th>
                    <th title="Played">P</th>
                    <th title="Won">W</th>
                    <th title="Drawn">D</th>
                    <th title="Lost">L</th>
                    <th title="Goals For">GF</th>
                    <th title="Goals Against">GA</th>
                    <th title="Goal Difference">GD</th>
                    <th title="Points">Pts</th>
                </tr>
            </thead>
            <tbody>
                ${table.map(row => {
                    const isUs = row.team === "Real Madrid";
                    const gd   = (row.gf ?? 0) - (row.ga ?? 0);
                    const logo = getClubLogo(row.team);
                    const crest = logo
                        ? `<img src="${logo}" class="cp-crest" alt="${row.team}" onerror="this.style.display='none'">`
                        : `<span class="cp-crest-init">${row.team[0]}</span>`;
                    return `
                    <tr class="${isUs ? "cp-row--us" : ""}">
                        <td class="cp-td-pos">${row.pos}</td>
                        <td class="cp-td-team">${crest}<span>${row.team}</span></td>
                        <td>${row.p  ?? 0}</td>
                        <td>${row.w  ?? 0}</td>
                        <td>${row.d  ?? 0}</td>
                        <td>${row.l  ?? 0}</td>
                        <td>${row.gf ?? 0}</td>
                        <td>${row.ga ?? 0}</td>
                        <td>${gd > 0 ? "+" : ""}${gd}</td>
                        <td class="cp-td-pts"${isUs ? ` style="color:${cc.text}"` : ""}>${row.pts ?? 0}</td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>
    </div>`;
}

// ── Results / Fixtures ──────────────────────────────────────────────────────

function renderResults(results) {
    if (!results.length) return `<div class="cp-empty">No results yet</div>`;
    return `<div class="cp-match-list">${results.map(matchRow).join("")}</div>`;
}

function renderFixtures(fixtures) {
    if (!fixtures.length) return `<div class="cp-empty">No upcoming fixtures</div>`;
    return `<div class="cp-match-list">${fixtures.map(matchRow).join("")}</div>`;
}

function matchRow(m) {
    const logo  = getClubLogo(m.opponent);
    const crest = logo
        ? `<img src="${logo}" class="cp-match-crest" alt="${m.opponent}" onerror="this.style.display='none'">`
        : `<span class="cp-match-crest cp-match-crest--init">${m.opponent[0]}</span>`;

    const cls = m.result === "W" ? "win" : m.result === "D" ? "draw" : m.result === "L" ? "loss" : "upcoming";
    const badge = m.result
        ? `<span class="cp-badge cp-badge--${cls}">${m.result}</span>`
        : `<span class="cp-badge cp-badge--upcoming">vs</span>`;
    const right = m.result
        ? `<span class="cp-match-score">${m.scoreFor}–${m.scoreAgainst}</span>`
        : (m.date ? `<span class="cp-match-date">${m.date}</span>` : "");

    return `
    <div class="cp-match-row">
        ${badge}
        ${crest}
        <div class="cp-match-info">
            <span class="cp-match-opp">${m.opponent}</span>
            <span class="cp-match-venue">${m.venue}${m.stage ? " · " + m.stage : ""}</span>
        </div>
        ${right}
    </div>`;
}

// ── Stats ───────────────────────────────────────────────────────────────────

function renderStats(comp, results) {
    const ls = _leagueStats[comp];
    const isLeague = !!(ls?.scorers?.length || ls?.assists?.length);

    const scorers   = ls?.scorers?.length   ? ls.scorers   : buildFromMatches(results, "goals");
    const assisters = ls?.assists?.length   ? ls.assists   : buildFromMatches(results, "assists");

    const STAT_TABS = [
        { key: "scorers",     label: "⚽ Scorers",  data: scorers },
        { key: "assists",     label: "🎯 Assists",  data: assisters },
        { key: "cleanSheets", label: "🧤 CS",       data: ls?.cleanSheets },
        { key: "yellowCards", label: "🟨 Yellows",  data: ls?.yellowCards },
        { key: "redCards",    label: "🟥 Reds",     data: ls?.redCards },
        { key: "avgRatings",  label: "⭐ Rating",   data: ls?.avgRatings },
    ].filter(s => s.data?.length);

    if (!STAT_TABS.find(s => s.key === _activeStat)) _activeStat = STAT_TABS[0]?.key ?? "scorers";

    return `
    <div class="cp-stats">
        ${isLeague ? `<div class="cp-stats-source">League-wide stats · ${results.length} matches played</div>` : ""}
        <div class="cp-stat-tabs" id="cp-stat-tabs">
            ${STAT_TABS.map(s => `<button class="cp-stat-tab${s.key === _activeStat ? " active" : ""}" data-stat="${s.key}">${s.label}</button>`).join("")}
        </div>
        <div id="cp-stat-body">${renderStatBody(_activeStat, scorers, assisters, ls)}</div>
    </div>`;
}

function renderStatBody(statKey, scorers, assisters, ls) {
    switch (statKey) {
        case "scorers":     return scorerSection("⚽ Top Scorers",     scorers,          scorers[0]?.goals ?? scorers[0]?.value ?? 1);
        case "assists":     return assistSection("🎯 Top Assists",     assisters,        assisters[0]?.assists ?? assisters[0]?.value ?? 1);
        case "cleanSheets": return cleanSheetSection("🧤 Clean Sheets", ls.cleanSheets, ls.cleanSheets[0]?.cleanSheets ?? 1);
        case "yellowCards": return cardSection("🟨 Yellow Cards",      ls.yellowCards,  ls.yellowCards[0]?.yellowCards ?? 1, "yellowCards");
        case "redCards":    return cardSection("🟥 Red Cards",         ls.redCards,     ls.redCards[0]?.redCards ?? 1,       "redCards");
        case "avgRatings":  return cardSection("⭐ Average Rating",    ls.avgRatings,   10,                                  "avgRating");
        default:            return "";
    }
}

function buildFromMatches(results, type) {
    const map = {};
    results.forEach(m => {
        m[type === "goals" ? "goals" : "assists"]?.forEach(e => {
            if (typeof e.player === "number")
                map[e.player] = (map[e.player] ?? 0) + (e.count ?? 1);
        });
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([id, value]) => ({ name: getPlayerName(Number(id)), rmId: Number(id), team: "Real Madrid", value }));
}

function scorerSection(title, players, max) {
    if (!players.length) return "";
    return `
    <div class="cp-stat-section">
        <div class="cp-stat-title">${title}</div>
        ${players.map((p, i) => {
            const val   = p.goals ?? p.value ?? 0;
            const logo  = getClubLogo(p.team);
            const crest = logo
                ? `<img src="${logo}" class="cp-stat-club" alt="${p.team}" onerror="this.style.display='none'">`
                : `<span class="cp-stat-club cp-stat-club--init">${p.team?.[0] ?? ""}</span>`;
            const render = p.rmId
                ? `<div class="cp-stat-render"><img src="assets/renders/${p.rmId}.png" alt="${p.name}" onerror="this.parentElement.style.display='none'"></div>`
                : `<div class="cp-stat-render cp-stat-render--empty"></div>`;
            return `
            <div class="cp-stat-row">
                <span class="cp-stat-rank">${i + 1}</span>
                ${render}
                <div class="cp-stat-info">
                    <span class="cp-stat-name">${p.name}</span>
                    <div class="cp-stat-club-row">${crest}<span class="cp-stat-team">${p.team ?? ""}</span></div>
                </div>
                <div class="cp-stat-bar-wrap">
                    <div class="cp-stat-bar" style="width:${Math.round(val / max * 100)}%"></div>
                </div>
                <span class="cp-stat-val">${val}</span>
            </div>`;
        }).join("")}
    </div>`;
}

function assistSection(title, players, max) {
    if (!players.length) return "";
    return `
    <div class="cp-stat-section">
        <div class="cp-stat-title">${title}</div>
        ${players.map((p, i) => {
            const val   = p.assists ?? p.value ?? 0;
            const logo  = getClubLogo(p.team);
            const crest = logo
                ? `<img src="${logo}" class="cp-stat-club" alt="${p.team}" onerror="this.style.display='none'">`
                : `<span class="cp-stat-club cp-stat-club--init">${p.team?.[0] ?? ""}</span>`;
            const render = p.rmId
                ? `<div class="cp-stat-render"><img src="assets/renders/${p.rmId}.png" alt="${p.name}" onerror="this.parentElement.style.display='none'"></div>`
                : `<div class="cp-stat-render cp-stat-render--empty"></div>`;
            return `
            <div class="cp-stat-row">
                <span class="cp-stat-rank">${i + 1}</span>
                ${render}
                <div class="cp-stat-info">
                    <span class="cp-stat-name">${p.name}</span>
                    <div class="cp-stat-club-row">${crest}<span class="cp-stat-team">${p.team ?? ""}</span></div>
                </div>
                <div class="cp-stat-bar-wrap">
                    <div class="cp-stat-bar" style="width:${Math.round(val / max * 100)}%"></div>
                </div>
                <span class="cp-stat-val">${val}</span>
            </div>`;
        }).join("")}
    </div>`;
}

function cleanSheetSection(title, keepers, max) {
    if (!keepers.length) return "";
    return `
    <div class="cp-stat-section">
        <div class="cp-stat-title">${title}</div>
        ${keepers.map((p, i) => {
            const logo  = getClubLogo(p.team);
            const crest = logo
                ? `<img src="${logo}" class="cp-stat-club" alt="${p.team}" onerror="this.style.display='none'">`
                : `<span class="cp-stat-club cp-stat-club--init">${p.team?.[0] ?? ""}</span>`;
            const render = p.rmId
                ? `<div class="cp-stat-render"><img src="assets/renders/${p.rmId}.png" alt="${p.name}" onerror="this.parentElement.style.display='none'"></div>`
                : `<div class="cp-stat-render cp-stat-render--empty"></div>`;
            return `
            <div class="cp-stat-row">
                <span class="cp-stat-rank">${i + 1}</span>
                ${render}
                <div class="cp-stat-info">
                    <span class="cp-stat-name">${p.name}</span>
                    <div class="cp-stat-club-row">${crest}<span class="cp-stat-team">${p.team ?? ""}</span></div>
                </div>
                <div class="cp-stat-bar-wrap">
                    <div class="cp-stat-bar" style="width:${Math.round(p.cleanSheets / max * 100)}%"></div>
                </div>
                <span class="cp-stat-val">${p.cleanSheets}</span>
            </div>`;
        }).join("")}
    </div>`;
}

function cardSection(title, players, max, field) {
    if (!players.length) return "";
    return `
    <div class="cp-stat-section">
        <div class="cp-stat-title">${title}</div>
        ${players.map((p, i) => {
            const val   = p[field] ?? 0;
            const logo  = getClubLogo(p.team);
            const crest = logo
                ? `<img src="${logo}" class="cp-stat-club" alt="${p.team}" onerror="this.style.display='none'">`
                : `<span class="cp-stat-club cp-stat-club--init">${p.team?.[0] ?? ""}</span>`;
            const render = p.rmId
                ? `<div class="cp-stat-render"><img src="assets/renders/${p.rmId}.png" alt="${p.name}" onerror="this.parentElement.style.display='none'"></div>`
                : `<div class="cp-stat-render cp-stat-render--empty"></div>`;
            return `
            <div class="cp-stat-row">
                <span class="cp-stat-rank">${i + 1}</span>
                ${render}
                <div class="cp-stat-info">
                    <span class="cp-stat-name">${p.name}</span>
                    <div class="cp-stat-club-row">${crest}<span class="cp-stat-team">${p.team ?? ""}</span></div>
                </div>
                <div class="cp-stat-bar-wrap">
                    <div class="cp-stat-bar" style="width:${Math.round(val / max * 100)}%"></div>
                </div>
                <span class="cp-stat-val">${val}</span>
            </div>`;
        }).join("")}
    </div>`;
}

// ── Init (event wiring) ─────────────────────────────────────────────────────

export function initializeCompetitions() {
    document.getElementById("cp-comp-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".cp-comp-tab");
        if (!btn) return;
        _activeComp = btn.dataset.comp;
        _activeTab  = "table";
        document.querySelectorAll(".cp-comp-tab").forEach(b => b.classList.toggle("active", b === btn));
        document.getElementById("cp-content").innerHTML = renderCompContent(_activeComp);
        bindSubTabs();
    });
    bindSubTabs();
    bindStatTabs();
}

function bindSubTabs() {
    document.getElementById("cp-sub-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".cp-sub-tab");
        if (!btn) return;
        _activeTab = btn.dataset.tab;
        document.querySelectorAll(".cp-sub-tab").forEach(b => b.classList.toggle("active", b === btn));

        const all      = _matches.filter(m => m.competition === _activeComp);
        const results  = all.filter(m => m.result).sort((a, b) => b.id - a.id);
        const fixtures = all.filter(m => !m.result).sort((a, b) => a.id - b.id);
        const table    = _standings[_activeComp] ?? [];
        document.getElementById("cp-tab-body").innerHTML =
            renderTab(_activeTab, _activeComp, results, fixtures, table);
        if (_activeTab === "stats") bindStatTabs();
    });
}

function bindStatTabs() {
    document.getElementById("cp-stat-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".cp-stat-tab");
        if (!btn) return;
        _activeStat = btn.dataset.stat;
        document.querySelectorAll(".cp-stat-tab").forEach(b => b.classList.toggle("active", b === btn));

        const all      = _matches.filter(m => m.competition === _activeComp);
        const results  = all.filter(m => m.result).sort((a, b) => b.id - a.id);
        const ls       = _leagueStats[_activeComp];
        const scorers  = ls?.scorers?.length  ? ls.scorers  : buildFromMatches(results, "goals");
        const assisters = ls?.assists?.length ? ls.assists  : buildFromMatches(results, "assists");
        document.getElementById("cp-stat-body").innerHTML = renderStatBody(_activeStat, scorers, assisters, ls ?? {});
    });
}
