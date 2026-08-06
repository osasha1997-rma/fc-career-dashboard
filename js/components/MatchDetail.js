// ==========================================
// CareerOS — Match Detail Panel
// ==========================================

import { getPlayerName } from "../utils/players.js";
import { getCompetitionLabel } from "../utils/competitions.js";
import { createMatchTimeline } from "./MatchTimeline.js";
import { createLineup } from "./Lineup.js";

export function createMatchDetails(match, players) {
    if (!match) return renderEmpty();

    const name = id => getPlayerName(id, players);

    return `
    <section class="match-detail">

        ${renderHeader(match)}
        ${renderTimeline(match, players)}
        ${renderGoals(match, name)}
        ${renderAssists(match, name)}
        ${renderGoalsConceded(match)}
        ${renderStats(match)}
        ${renderRatings(match, name)}
        ${renderLineup(match, players)}
        ${renderSubstitutions(match, name)}
        ${renderCards(match, name)}
        ${renderInjuries(match, name)}

    </section>`;
}

// ── Sections ────────────────────────────────────────────────

function renderEmpty() {
    return `
    <div class="match-detail match-detail--empty">
        <p>Select a match to view the report.</p>
    </div>`;
}

function renderHeader(match) {
    return `
    <div class="md-header">
        <span class="md-competition">${getCompetitionLabel(match.competition)}</span>
        <div class="md-score">
            <span>Real Madrid</span>
            <strong>${match.scoreFor} – ${match.scoreAgainst}</strong>
            <span>${match.opponent}</span>
        </div>
        <div class="md-meta">
            <span>${match.venue}</span>
            ${match.date ? `<span>${match.date}</span>` : ""}
        </div>
    </div>`;
}

function renderTimeline(match, players) {
    const content = createMatchTimeline(match, players);
    return content ? renderSection("Timeline", `<div class="timeline">${content}</div>`) : "";
}

function renderGoals(match, name) {
    if (!match.goals?.length) return renderSection("Goals", "<p class='md-empty'>No goals</p>");
    const rows = match.goals.map(g => `
        <div class="md-event">
            <span class="md-minute">${g.minute}'</span>
            <span>${name(g.player)}</span>
            <span class="md-icon">⚽</span>
        </div>`).join("");
    return renderSection("Goals", rows);
}

function renderAssists(match, name) {
    if (!match.assists?.length) return "";
    const rows = match.assists.map(a => `
        <div class="md-event">
            <span class="md-minute"></span>
            <span>${name(a.player)}</span>
            <span class="md-badge">${a.count > 1 ? `×${a.count}` : ""} 🎯</span>
        </div>`).join("");
    return renderSection("Assists", rows);
}

function renderGoalsConceded(match) {
    const goals = match.goalsConceded ?? [];
    if (!goals.length) return renderSection("Goals Conceded", "<p class='md-empty'>Clean sheet</p>");
    const rows = goals.map(g => `
        <div class="md-event">
            <span class="md-minute">${g.minute}'</span>
            <span>${g.player}</span>
            <span class="md-icon md-icon--danger">⚽</span>
        </div>`).join("");
    return renderSection("Goals Conceded", rows);
}

function renderStats(match) {
    const t = match.teamStats;
    const o = match.opponentStats;
    if (!t || !o) return "";

    const row = (label, home, away) => `
        <div class="md-stat-row">
            <span class="md-stat-val">${home}</span>
            <span class="md-stat-label">${label}</span>
            <span class="md-stat-val">${away}</span>
        </div>
        <div class="md-stat-bar">
            <div class="md-stat-bar__fill md-stat-bar__fill--home"
                 style="width:${(home / (home + away)) * 100}%"></div>
            <div class="md-stat-bar__fill md-stat-bar__fill--away"
                 style="width:${(away / (home + away)) * 100}%"></div>
        </div>`;

    return renderSection("Match Statistics", `
        <div class="md-stats-header">
            <span>Real Madrid</span>
            <span>${match.opponent}</span>
        </div>
        ${row("Possession %", t.possession, o.possession)}
        ${row("Shots", t.shots, o.shots)}
        ${row("Passes", t.passes, o.passes)}
        ${row("Pass Accuracy %", t.passAccuracy, o.passAccuracy)}
        ${row("Tackles", t.tackles, o.tackles)}
    `);
}

function renderRatings(match, name) {
    if (!match.performances?.length) return "";
    const rows = [...match.performances]
        .sort((a, b) => b.rating - a.rating)
        .map(p => {
            const cls = p.rating >= 8 ? "rating--high" : p.rating >= 6.5 ? "rating--mid" : "rating--low";
            return `
            <div class="md-rating-row">
                <span>${name(p.player)}</span>
                <span class="md-rating ${cls}">${p.rating.toFixed(1)}</span>
            </div>`;
        }).join("");
    return renderSection("Player Ratings", rows);
}

function renderLineup(match, players) {
    return renderSection("Lineup", createLineup(match, players));
}

function renderSubstitutions(match, name) {
    const subs = match.substitutions ?? [];
    if (!subs.length) return "";
    const rows = subs.map(s => `
        <div class="md-event">
            <span class="md-minute">${s.minute}'</span>
            <span class="md-sub-on">▲ ${name(s.playerOn)}</span>
            <span class="md-sub-off">▼ ${name(s.playerOff)}</span>
        </div>`).join("");
    return renderSection("Substitutions", rows);
}

function renderCards(match, name) {
    const yellows = match.yellowCards ?? [];
    const reds = match.redCards ?? [];
    if (!yellows.length && !reds.length) return "";

    const rows = [
        ...yellows.map(c => `
        <div class="md-event">
            <span>${name(c.player)}</span>
            <span class="md-card md-card--yellow">🟨</span>
        </div>`),
        ...reds.map(c => `
        <div class="md-event">
            <span>${name(c.player)}</span>
            <span class="md-card md-card--red">🟥</span>
        </div>`)
    ].join("");

    return renderSection("Cards", rows);
}

function renderInjuries(match, name) {
    const injuries = match.injuries ?? [];
    if (!injuries.length) return "";
    const rows = injuries.map(i => `
        <div class="md-event">
            <span class="md-minute">${i.minute}'</span>
            <span>${name(i.player)}</span>
            <span class="md-badge md-badge--danger">${i.daysOut}d out</span>
        </div>`).join("");
    return renderSection("Injuries", rows);
}

// ── Shared layout helper ─────────────────────────────────────

function renderSection(title, content) {
    return `
    <div class="md-section">
        <h3 class="md-section-title">${title}</h3>
        ${content}
    </div>`;
}
