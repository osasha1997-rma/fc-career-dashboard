// ==========================================
// CareerOS — Match Detail Panel
// ==========================================

import { getPlayerName } from "../utils/players.js";
import { getCompetitionLabel, getCompetitionColor } from "../utils/competitions.js";
import { getClubColor } from "../utils/clubColors.js";
import { getClubLogo }  from "../utils/clubLogos.js";
import { createMatchTimeline } from "./MatchTimeline.js";
import { createLineup } from "./Lineup.js";

const HOME_COLOR = "#D4AF37"; // Real Madrid gold

export function createMatchDetails(match, players) {
    if (!match) return renderEmpty();

    const name         = id => getPlayerName(id, players);
    const awayColor    = getClubColor(match.opponent);

    return `
    <section class="match-detail">

        ${renderScoreHeader(match, name, awayColor)}

        <div class="md-tabs">
            <button class="md-tab active" data-tab="details">Details</button>
            <button class="md-tab" data-tab="lineups">Lineups</button>
            <button class="md-tab" data-tab="statistics">Statistics</button>
        </div>

        <div class="md-tab-content" data-content="details">
            ${renderDetailsTab(match, players, name)}
        </div>

        <div class="md-tab-content md-tab-hidden" data-content="lineups">
            <div class="md-tab-body">
                ${createLineup(match, players)}
            </div>
        </div>

        <div class="md-tab-content md-tab-hidden" data-content="statistics">
            <div class="md-tab-body">
                ${renderStats(match, awayColor)}
            </div>
        </div>

    </section>`;
}

// ── Score Header ─────────────────────────────────────────────

function renderScoreHeader(match, name, awayColor) {
    const ourScorers  = (match.goals ?? []).map(g =>
        `<div class="md-scorer" style="color:${HOME_COLOR}">${name(g.player)} ${g.minute}'</div>`
    ).join("");
    const theirScorers = (match.goalsConceded ?? []).map(g =>
        `<div class="md-scorer" style="color:${awayColor}">${g.player}${g.minute != null ? ` ${g.minute}'` : ""}</div>`
    ).join("");

    const cc = getCompetitionColor(match.competition);
    const homeCrest = crest("Real Madrid", HOME_COLOR);
    const awayCrest = crest(match.opponent, awayColor);

    return `
    <div class="md-header">
        <div class="md-comp-row">
            <span class="md-competition" style="background:${cc.bg};border-color:${cc.border};color:${cc.text}">${getCompetitionLabel(match.competition)}</span>
            ${match.stage ? `<span class="md-stage-pill">${match.stage}</span>` : ""}
        </div>
        ${match.date ? `<p class="md-date">${match.date}</p>` : ""}

        <div class="md-score-header">
            <div class="md-team md-team--home">
                ${homeCrest}
                <div class="md-team-name">Real Madrid</div>
                <div class="md-scorers">${ourScorers}</div>
            </div>

            <div class="md-score-center">
                <div class="md-scoreline">${match.scoreFor} – ${match.scoreAgainst}</div>
                <div class="md-match-status">FT</div>
            </div>

            <div class="md-team md-team--away">
                ${awayCrest}
                <div class="md-team-name">${match.opponent}</div>
                <div class="md-scorers">${theirScorers}</div>
            </div>
        </div>

        <div class="md-venue-row">
            <span>🏟 ${match.venue}</span>
            ${match.matchday ? `<span>MD ${match.matchday}</span>` : ""}
        </div>
    </div>`;
}

// ── Details Tab ───────────────────────────────────────────────

function renderDetailsTab(match, players, name) {
    const timeline = createMatchTimeline(match, players);
    const ratings  = renderRatings(match, name);

    return `
    <div class="md-tab-body">
        ${timeline ? `<div class="timeline">${timeline}</div>` : ""}
        ${ratings}
    </div>`;
}

// ── Statistics ────────────────────────────────────────────────

function renderStats(match, awayColor) {
    const t = match.teamStats;
    const o = match.opponentStats;
    if (!t || !o) return `<div class="md-no-data"><span>📊</span><p>No statistics recorded for this match</p></div>`;

    const row = (label, home, away) => {
        const total = home + away || 1;
        return `
        <div class="md-stat-row">
            <span class="md-stat-val">${home}</span>
            <span class="md-stat-label">${label}</span>
            <span class="md-stat-val">${away}</span>
        </div>
        <div class="md-stat-bar">
            <div class="md-stat-bar__fill md-stat-bar__fill--home" style="width:${(home / total) * 100}%"></div>
            <div class="md-stat-bar__fill md-stat-bar__fill--away" style="width:${(away / total) * 100}%;background:${awayColor}"></div>
        </div>`;
    };

    return `
    <div class="md-stats-header">
        <span>Real Madrid</span>
        <span>${match.opponent}</span>
    </div>
    ${row("Possession %",   t.possession,   o.possession)}
    ${row("Shots",          t.shots,        o.shots)}
    ${row("Passes",         t.passes,       o.passes)}
    ${row("Pass Accuracy %",t.passAccuracy, o.passAccuracy)}
    ${row("Tackles",        t.tackles,      o.tackles)}`;
}

// ── Ratings ───────────────────────────────────────────────────

function renderRatings(match, name) {
    if (!match.performances?.length) return "";

    const sorted = [...match.performances].sort((a, b) => b.rating - a.rating);
    const [potm, ...rest] = sorted;

    const ratingCls = r => r >= 8 ? "rating--high" : r >= 6.5 ? "rating--mid" : "rating--low";

    const restRows = rest.map(p => `
        <div class="md-rating-row">
            <span class="md-rating-name">${name(p.player)}</span>
            <span class="md-rating ${ratingCls(p.rating)}">${p.rating.toFixed(1)}</span>
        </div>`).join("");

    const potmId = typeof potm.player === "number" ? potm.player : null;

    return `
    <div class="md-ratings-block">
        <h3 class="md-section-title">Player of the Match</h3>
        <div class="md-potm">
            ${potmId ? `
            <div class="md-potm-render-wrap">
                <img src="assets/renders/${potmId}.png" class="md-potm-render" alt="${name(potm.player)}"
                     onerror="this.parentElement.style.display='none'">
            </div>` : ""}
            <div class="md-potm-info">
                <div class="md-potm-name">${name(potm.player)}</div>
                <span class="md-rating md-potm-rating ${ratingCls(potm.rating)}">${potm.rating.toFixed(1)}</span>
            </div>
        </div>
        ${rest.length ? `<div class="md-ratings-list">${restRows}</div>` : ""}
    </div>`;
}

// ── Crest ─────────────────────────────────────────────────────

function crest(name, color) {
    const logo = getClubLogo(name);
    if (logo) return `<div class="md-crest md-crest--img"><img src="${logo}" alt="${name}" class="md-crest-img"></div>`;
    const initials = name.split(" ")
        .filter(w => !["Real","RCD","SD","FC","CA","CF","GNK","SL","UD","de"].includes(w))
        .slice(0, 2).map(w => w[0]).join("").toUpperCase() || name[0].toUpperCase();
    return `<div class="md-crest" style="background:${color}20;border-color:${color}60;color:${color}">${initials}</div>`;
}

// ── Empty state ───────────────────────────────────────────────

function renderEmpty() {
    return `
    <div class="match-detail match-detail--empty">
        <div class="md-empty-icon">📋</div>
        <p class="md-empty-title">No match selected</p>
        <p class="md-empty-sub">Pick a result above to view the match report</p>
    </div>`;
}
