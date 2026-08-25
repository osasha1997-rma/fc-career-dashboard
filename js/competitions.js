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
let _clubName    = "Real Madrid";
let _activeComp  = "laliga";
let _activeTab   = "table";
let _activeStat  = "scorers";

export function createCompetitions(matches = [], standings = {}, leagueStats = {}, clubName = "Real Madrid") {
    _matches     = matches;
    _standings   = standings;
    _leagueStats = leagueStats;
    _clubName    = clubName;

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
    const importBtn = `
    <div class="cp-import-row">
        <button class="cp-import-btn" id="cp-import-table-btn">📷 Import from image</button>
        <input type="file" id="cp-import-file" accept="image/*" multiple style="display:none">
        <span class="cp-import-status" id="cp-import-status"></span>
    </div>`;
    if (!table.length) return importBtn + `<div class="cp-empty">No standings data yet. Upload a screenshot to import.</div>`;
    const cc = getCompetitionColor(comp);
    return importBtn + `
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
                    const isUs = row.team === _clubName;
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
        <div class="cp-import-row">
            <button class="cp-import-btn" id="cp-import-stats-btn">📷 Import from image</button>
            <input type="file" id="cp-import-stats-file" accept="image/*" multiple style="display:none">
            <span class="cp-import-status" id="cp-import-stats-status"></span>
        </div>
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
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([id, value]) => ({ name: getPlayerName(Number(id)), rmId: Number(id), team: "Real Madrid", value }));
}

function scorerSection(title, players, max) {
    if (!players.length) return "";
    return `
    <div class="cp-stat-section">
        <div class="cp-stat-title">${title}</div>
        ${players.slice(0, 5).map((p, i) => {
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
        ${players.slice(0, 5).map((p, i) => {
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
        ${keepers.slice(0, 5).map((p, i) => {
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
        ${players.slice(0, 5).map((p, i) => {
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
        bindImportTable();
    });
    bindSubTabs();
    bindStatTabs();
    bindImportTable();
    bindImportStats();
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
        if (_activeTab === "stats") { bindStatTabs(); bindImportStats(); }
        if (_activeTab === "table") bindImportTable();
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

function bindImportTable() {
    const btn    = document.getElementById("cp-import-table-btn");
    const input  = document.getElementById("cp-import-file");
    const status = document.getElementById("cp-import-status");
    if (!btn || !input) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
        const files = [...input.files];
        if (!files.length) return;
        input.value = "";

        btn.disabled = true;

        const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:4000/api"
            : "https://fc-career-dashboard.onrender.com/api";

        try {
            const allRows = [];
            for (let i = 0; i < files.length; i++) {
                status.textContent = `Extracting image ${i + 1}/${files.length}…`;
                const imageBase64 = await fileToBase64(files[i]);
                const res = await fetch(`${apiBase}/ai/extract-table`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64, mimeType: files[i].type }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error(err.error ?? res.statusText);
                }
                const { rows: parsed } = await res.json();
                allRows.push(...parsed);
            }

            status.textContent = "Merging…";
            // Deduplicate by pos — later images win
            const rowMap = {};
            for (const r of allRows) rowMap[r.pos] = r;
            const rows = Object.values(rowMap).sort((a, b) => a.pos - b.pos);

            if (!rows.length) throw new Error("No table rows found — try a cleaner screenshot");

            status.textContent = `Found ${rows.length} rows. Saving…`;

            const careerId = window._careerId;
            if (!careerId) throw new Error("No active career");

            const patch = {};
            patch[`standings.${_activeComp}`] = rows;
            const res = await fetch(`${apiBase}/careers/${careerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error(`Save failed: ${res.status}`);

            _standings[_activeComp] = rows;

            const all      = _matches.filter(m => m.competition === _activeComp);
            const results  = all.filter(m => m.result).sort((a, b) => b.id - a.id);
            const fixtures = all.filter(m => !m.result).sort((a, b) => a.id - b.id);
            document.getElementById("cp-tab-body").innerHTML =
                renderTab("table", _activeComp, results, fixtures, rows);
            bindImportTable();
            status.textContent = "";
        } catch (err) {
            status.textContent = `Error: ${err.message}`;
            btn.disabled = false;
        }
    });
}

function bindImportStats() {
    const btn    = document.getElementById("cp-import-stats-btn");
    const input  = document.getElementById("cp-import-stats-file");
    const status = document.getElementById("cp-import-stats-status");
    if (!btn || !input) return;

    btn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
        const files = [...input.files];
        if (!files.length) return;
        input.value = "";
        btn.disabled = true;

        const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:4000/api"
            : "https://fc-career-dashboard.onrender.com/api";

        try {
            const allRows = [];
            for (let i = 0; i < files.length; i++) {
                status.textContent = `Extracting image ${i + 1}/${files.length}…`;
                const imageBase64 = await fileToBase64(files[i]);
                const res = await fetch(`${apiBase}/ai/extract-stats`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64, mimeType: files[i].type, statType: _activeStat }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error(err.error ?? res.statusText);
                }
                const { rows } = await res.json();
                allRows.push(...rows);
            }

            // Deduplicate by name — later wins
            const seen = {};
            const rows = allRows.filter(r => { const k = r.name?.toLowerCase(); return k && !seen[k] && (seen[k] = true); });
            if (!rows.length) throw new Error("No stats found in image");

            status.textContent = "Saving…";
            const careerId = window._careerId;
            if (!careerId) throw new Error("No active career");

            // Merge into existing leagueStats
            const existing = _leagueStats[_activeComp] ?? {};
            existing[_activeStat] = rows;
            _leagueStats[_activeComp] = existing;

            const patch = {};
            patch[`leagueStats.${_activeComp}`] = existing;
            const saveRes = await fetch(`${apiBase}/careers/${careerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!saveRes.ok) throw new Error(`Save failed: ${saveRes.status}`);

            // Re-render stats tab
            const all      = _matches.filter(m => m.competition === _activeComp);
            const results  = all.filter(m => m.result).sort((a, b) => b.id - a.id);
            document.getElementById("cp-tab-body").innerHTML = renderTab("stats", _activeComp, results, [], []);
            bindStatTabs();
            bindImportStats();
            status.textContent = "";
        } catch (err) {
            status.textContent = `Error: ${err.message}`;
            btn.disabled = false;
        }
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function parseTableText(raw) {
    const rows = [];
    for (const line of raw.split("\n")) {
        // Strip leading noise (arrows, pipes, bullets, etc.)
        const t = line.replace(/^[\s▶►▸▷❯>|•\-]+/, "").trim();
        // Match: pos  team-name  P W D L GF GA [GD] Pts
        // GD can be negative; team name can contain letters, spaces, accents, colons
        const m = t.match(/^(\d{1,3})\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(\d+)\s*$/);
        if (m) {
            // 10 groups: pos team P W D L GF GA GD Pts
            rows.push({
                pos:  parseInt(m[1]),
                team: m[2].trim().replace(/:$/, ""),
                p:    parseInt(m[3]),
                w:    parseInt(m[4]),
                d:    parseInt(m[5]),
                l:    parseInt(m[6]),
                gf:   parseInt(m[7]),
                ga:   parseInt(m[8]),
                // m[9] = GD (skip — we calculate it)
                pts:  parseInt(m[10]),
            });
            continue;
        }
        // Fallback: 7 numbers (no GD column)
        const m2 = t.match(/^(\d{1,3})\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
        if (m2) {
            rows.push({
                pos:  parseInt(m2[1]),
                team: m2[2].trim().replace(/:$/, ""),
                p:    parseInt(m2[3]),
                w:    parseInt(m2[4]),
                d:    parseInt(m2[5]),
                l:    parseInt(m2[6]),
                gf:   parseInt(m2[7]),
                ga:   parseInt(m2[8]),
                pts:  parseInt(m2[9]),
            });
        }
    }
    return rows.sort((a, b) => a.pos - b.pos);
}
