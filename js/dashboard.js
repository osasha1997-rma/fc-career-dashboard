// ==========================================
// CareerOS — Dashboard
// ==========================================

import { getClubLogo } from "./utils/clubLogos.js";

function formatCurrency(value) {
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `€${(value / 1_000).toFixed(0)}K`;
    return `€${value}`;
}

function resultClass(r) {
    return r === "W" ? "win" : r === "D" ? "draw" : "loss";
}

function renderForm(matches) {
    const played = matches.filter(m => m.result).slice(-6);
    if (!played.length) return "";
    const chips = played.map(m => `
        <span class="db-form-chip db-form-chip--${resultClass(m.result)}" title="${m.opponent}">
            ${m.result}
        </span>`).join("");
    return `
    <div class="db-section">
        <div class="db-section-label">Recent Form</div>
        <div class="db-form-strip">${chips}</div>
    </div>`;
}

function renderKeyStats(s) {
    const items = [
        { value: s.played,       label: "Played" },
        { value: `${s.wins}W ${s.draws}D ${s.losses}L`, label: "Record" },
        { value: `${s.goalsFor}–${s.goalsAgainst}`, label: "Goals" },
        { value: s.cleanSheets,  label: "Clean Sheets" },
    ];
    return `
    <div class="db-stats-row">
        ${items.map(i => `
        <div class="db-stat-pill">
            <span class="db-stat-pill-value">${i.value}</span>
            <span class="db-stat-pill-label">${i.label}</span>
        </div>`).join("")}
    </div>`;
}

function renderTopPerformers(s) {
    if (!s.topScorer && !s.topAssists && !s.topRated) return "";
    const card = (icon, label, p, value) => p?.name ? `
        <div class="db-perf-card">
            ${p.id ? `
            <div class="db-perf-render-wrap">
                <img src="assets/renders/${p.id}.png" class="db-perf-render" alt="${p.name}"
                     onerror="this.parentElement.style.display='none'">
            </div>` : `<div class="db-perf-icon">${icon}</div>`}
            <div class="db-perf-info">
                <div class="db-perf-label">${label}</div>
                <div class="db-perf-name">${p.name}</div>
                <div class="db-perf-value">${value}</div>
            </div>
        </div>` : "";
    return `
    <div class="db-section">
        <div class="db-section-label">Top Performers</div>
        <div class="db-perf-row">
            ${card("⚽", "Top Scorer",  s.topScorer,  `${s.topScorer?.goals} goals`)}
            ${card("🎯", "Top Assists", s.topAssists, `${s.topAssists?.assists} assists`)}
            ${card("⭐", "Best Rated",  s.topRated,   `${s.topRated?.rating} avg`)}
        </div>
    </div>`;
}

function renderFixtures(season, matches) {
    const last = season.lastFixture;
    const cls  = last?.result ? resultClass(last.result) : "";

    const upcoming = matches.filter(m => !m.result).slice(0, 3);
    const comps    = [...new Set(upcoming.map(m => m.competition))];

    const nextCards = upcoming.map(m => {
        const logo = getClubLogo(m.opponent);
        const crest = logo
            ? `<img src="${logo}" class="db-fixture-crest" alt="${m.opponent}">`
            : `<div class="db-fixture-crest db-fixture-crest--initials">${m.opponent[0]}</div>`;
        return `
        <div class="db-fixture-card db-fixture-card--next db-upcoming" data-comp="${m.competition}" style="display:none">
            <div class="db-fixture-badge db-fixture-badge--upcoming">NEXT</div>
            <div class="db-fixture-body">
                <div class="db-fixture-comp">${m.competition.toUpperCase()}</div>
                <div class="db-fixture-opp">${m.opponent}</div>
                <div class="db-fixture-venue">${m.venue}</div>
            </div>
            ${crest}
            ${m.date ? `<div class="db-fixture-date">${m.date}</div>` : ""}
        </div>`;
    }).join("");

    const filterBtns = comps.length > 1 ? `
        <div class="db-fixture-filter">
            <button class="db-fix-btn active" data-comp="all">All</button>
            ${comps.map(c => `<button class="db-fix-btn" data-comp="${c}">${c.toUpperCase()}</button>`).join("")}
        </div>` : "";

    return `
    <div class="db-section">
        <div class="db-section-label">Fixtures</div>
        ${filterBtns}
        <div class="db-fixtures">
            ${last ? (() => {
                const logo = getClubLogo(last.opponent);
                const crest = logo
                    ? `<img src="${logo}" class="db-fixture-crest" alt="${last.opponent}">`
                    : `<div class="db-fixture-crest db-fixture-crest--initials">${last.opponent[0]}</div>`;
                return `
                <div class="db-fixture-card">
                    <div class="db-fixture-badge db-fixture-badge--${cls}">${last.result}</div>
                    <div class="db-fixture-body">
                        <div class="db-fixture-comp">${last.competition?.toUpperCase() ?? ""}</div>
                        <div class="db-fixture-opp">${last.opponent}</div>
                        <div class="db-fixture-venue">${last.venue}</div>
                    </div>
                    ${crest}
                    <div class="db-fixture-score db-fixture-score--${cls}">${last.score}</div>
                </div>`;
            })() : ""}
            ${nextCards}
        </div>
    </div>`;
}

function playerInfoItem(label, name, findPlayer) {
    const p = findPlayer(name);
    const avatar = p
        ? `<div class="db-info-render-wrap"><img src="assets/renders/${p.id}.png" class="db-info-render" alt="${name}" onerror="this.parentElement.style.display='none'"></div>`
        : `<span class="db-info-icon">👤</span>`;
    return `
    <div class="db-info-item">
        ${avatar}
        <div class="db-info-text">
            <span class="db-info-label">${label}</span>
            <span class="db-info-value">${name ?? "—"}</span>
        </div>
    </div>`;
}

function renderSeasonInfo(season, s, findPlayer) {
    const basicItems = [
        { icon: "🏟️", label: "Formation",  value: season.formation },
        { icon: "💰", label: "Budget",     value: formatCurrency(season.transferBudget) },
        { icon: "🎯", label: "Difficulty", value: season.difficulty },
        { icon: "🔄", label: "Transfers",  value: season.transferWindow },
        ...(s.avgPossession != null ? [{ icon: "⚙️", label: "Avg Poss",   value: `${s.avgPossession}%` }] : []),
        ...(s.avgTeamRating != null ? [{ icon: "📊", label: "Avg Rating", value: s.avgTeamRating }] : []),
    ];
    return `
    <div class="db-section">
        <div class="db-section-label">Season Info</div>
        <div class="db-info-grid">
            ${playerInfoItem("Captain",      season.captain,     findPlayer)}
            ${playerInfoItem("Vice Captain", season.viceCaptain, findPlayer)}
            ${basicItems.map(i => `
            <div class="db-info-item">
                <span class="db-info-icon">${i.icon}</span>
                <div class="db-info-text">
                    <span class="db-info-label">${i.label}</span>
                    <span class="db-info-value">${i.value}</span>
                </div>
            </div>`).join("")}
        </div>
    </div>`;
}

export function renderDashboard(season, stats, matches = [], players = []) {
    const s = stats;
    const findPlayer = name => players.find(p => p.name === name);
    return `
    <div class="hero-card">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <div class="hero-text">
                <div class="hero-season">${season.season} · ${season.competition}</div>
                <h1 class="hero-club">${season.club}</h1>
                <div class="hero-manager">🧑‍💼 ${season.manager}</div>
            </div>
            <img class="club-logo" src="assets/icons/logo.png" alt="Real Madrid">
        </div>
    </div>

    <div class="db-body">
        ${renderKeyStats(s)}
        ${renderForm(matches)}
        ${renderTopPerformers(s)}
        ${renderFixtures(season, matches)}
        ${renderSeasonInfo(season, s, findPlayer)}
    </div>`;
}
