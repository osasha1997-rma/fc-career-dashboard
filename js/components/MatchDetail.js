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
            <button class="md-tab" data-tab="analysis">Analysis</button>
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

        <div class="md-tab-content md-tab-hidden" data-content="analysis">
            <div class="md-tab-body">
                ${renderAnalysis(match, players, name, awayColor)}
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
        `<div class="md-scorer" style="color:${awayColor}">${g.scorer ?? g.player ?? "Unknown"}${g.minute != null ? ` ${g.minute}'` : ""}</div>`
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

// ── Analysis ──────────────────────────────────────────────────

function renderAnalysis(match, players, name, awayColor) {
    const t  = match.teamStats;
    const o  = match.opponentStats;
    const hasStats = !!(t && o);

    // ── Grade & verdict ─────────────────────────────────────────
    const avgRating = match.performances?.length
        ? match.performances.reduce((s, p) => s + p.rating, 0) / match.performances.length
        : null;

    const grade = r => {
        if (r >= 8.5) return { letter: "A+", col: "#22c55e" };
        if (r >= 8.0) return { letter: "A",  col: "#22c55e" };
        if (r >= 7.5) return { letter: "B+", col: "#84cc16" };
        if (r >= 7.0) return { letter: "B",  col: "#84cc16" };
        if (r >= 6.5) return { letter: "C+", col: "#f59e0b" };
        if (r >= 6.0) return { letter: "C",  col: "#f59e0b" };
        return          { letter: "D",  col: "#ef4444" };
    };

    const { gf, ga } = { gf: match.scoreFor ?? 0, ga: match.scoreAgainst ?? 0 };
    const diff = gf - ga;

    const verdictText = () => {
        const poss = t?.possession ?? 50;
        const shots = t?.shots ?? 0;
        const oShots = o?.shots ?? 0;
        const dominated = poss >= 55 && shots > oShots;
        const dominated_by = poss < 45 && oShots > shots;

        if (match.result === "W") {
            if (diff >= 3 && dominated)  return "Dominant victory — controlled the game from start to finish.";
            if (diff >= 3)               return "Comfortable win — clinical finishing made the difference.";
            if (dominated_by && diff > 0) return "Backs-to-the-wall win — resilient defending and clinical counter-attack.";
            if (shots > 0 && gf / shots >= 0.4) return "Efficient display — made the most of limited chances.";
            return "Hard-fought win — professionalism over flair.";
        }
        if (match.result === "D") {
            if (ga === 0)                return "Solid stalemate — clean sheet preserved a point.";
            if (gf >= 2 && ga >= 2)      return "High-intensity draw — open encounter with chances at both ends.";
            if (dominated_by)            return "Fortunate point — came under sustained pressure throughout.";
            return "Even contest — neither side could find a decisive moment.";
        }
        if (match.result === "L") {
            if (diff <= -3)              return "Heavy defeat — a performance to forget quickly.";
            if (dominated_by && diff < 0) return "Outplayed — the opponent controlled the match and deserved the win.";
            if (ga >= 3)                 return "Defensive collapse — multiple errors cost the result.";
            return "Narrow defeat — fine margins went against the team.";
        }
        return "";
    };

    const resultColor = match.result === "W" ? "#22c55e" : match.result === "D" ? "#f59e0b" : "#ef4444";
    const g = avgRating ? grade(avgRating) : null;

    // ── Tactical sections ────────────────────────────────────────
    const tacticalInsights = () => {
        if (!hasStats) return "";
        const poss = t.possession;
        const shotEff = gf > 0 && t.shots > 0 ? (gf / t.shots * 100).toFixed(0) : 0;
        const passAcc = t.passAccuracy;
        const oppPassAcc = o.passAccuracy;

        const possText = poss >= 55
            ? `Real Madrid dominated possession with <strong>${poss}%</strong>, dictating the tempo.`
            : poss < 45
            ? `Madrid ceded possession to ${match.opponent} (${poss}% vs ${o.possession}%), playing on the counter.`
            : `Possession was evenly split (${poss}%–${o.possession}%), reflecting a balanced midfield battle.`;

        const shotsText = t.shots > o.shots
            ? `Madrid created more danger with <strong>${t.shots} shots</strong> to ${match.opponent}'s ${o.shots}.`
            : t.shots < o.shots
            ? `${match.opponent} generated more chances (${o.shots} shots vs ${t.shots}), creating pressure in the final third.`
            : `Both sides created an equal number of chances (${t.shots} shots each).`;

        const effText = shotEff > 0
            ? `Shot conversion rate was <strong>${shotEff}%</strong>${Number(shotEff) >= 30 ? " — clinical in front of goal." : " — room to improve efficiency."}`
            : "";

        const passText = passAcc >= 88
            ? `Madrid's passing was sharp at <strong>${passAcc}% accuracy</strong>, maintaining quality in build-up.`
            : passAcc < 82
            ? `Passing was below par at ${passAcc}% — the team struggled to maintain composure in possession.`
            : `Passing accuracy of ${passAcc}% was adequate but ${oppPassAcc > passAcc ? "the opponent circulated the ball more cleanly" : "there is still room for improvement"}.`;

        return `
        <div class="ma-section">
            <div class="ma-section-title">Tactical Breakdown</div>
            <div class="ma-insight-rows">
                <div class="ma-insight-row"><span class="ma-insight-icon">🔵</span><span>${possText}</span></div>
                <div class="ma-insight-row"><span class="ma-insight-icon">🎯</span><span>${shotsText}</span></div>
                ${effText ? `<div class="ma-insight-row"><span class="ma-insight-icon">⚡</span><span>${effText}</span></div>` : ""}
                <div class="ma-insight-row"><span class="ma-insight-icon">🔄</span><span>${passText}</span></div>
            </div>
        </div>`;
    };

    // ── Key moments ──────────────────────────────────────────────
    const keyMomentsSection = () => {
        const events = [];
        (match.goals ?? []).forEach(g => events.push({ min: g.minute, type: "goal",    label: `⚽ ${name(g.player)} scores`, team: "home" }));
        (match.goalsConceded ?? []).forEach(g => { if (g.minute) events.push({ min: g.minute, type: "conceded", label: `⚽ ${g.scorer ?? g.player ?? "Unknown"} scores for ${match.opponent}`, team: "away" }); });
        (match.yellowCards ?? []).forEach(c => { if (c.minute) events.push({ min: c.minute, type: "yellow", label: `🟨 ${name(c.player)} booked`, team: "home" }); });
        (match.redCards ?? []).forEach(c => { if (c.minute) events.push({ min: c.minute, type: "red", label: `🟥 ${name(c.player)} sent off`, team: "home" }); });
        (match.injuries ?? []).forEach(i => { if (i.minute) events.push({ min: i.minute, type: "injury", label: `🚑 ${name(i.player)} injured (${i.daysOut} days)`, team: "home" }); });
        events.sort((a, b) => a.min - b.min);
        if (!events.length) return "";
        return `
        <div class="ma-section">
            <div class="ma-section-title">Key Moments</div>
            <div class="ma-timeline">
                ${events.map(e => `
                <div class="ma-event ma-event--${e.team}">
                    <span class="ma-event-min">${e.min}'</span>
                    <span class="ma-event-label">${e.label}</span>
                </div>`).join("")}
            </div>
        </div>`;
    };

    // ── Player spotlight ─────────────────────────────────────────
    const playerSpotlight = () => {
        if (!match.performances?.length) return "";
        const sorted = [...match.performances].sort((a, b) => b.rating - a.rating);
        const stars  = sorted.slice(0, 3);
        const worst  = sorted[sorted.length - 1];
        const ratingCls = r => r >= 8 ? "rating--high" : r >= 6.5 ? "rating--mid" : "rating--low";

        const goalMap = {};
        (match.goals ?? []).forEach(g => { goalMap[g.player] = (goalMap[g.player] ?? 0) + 1; });
        const assistMap = {};
        (match.assists ?? []).forEach(a => { assistMap[a.player] = (assistMap[a.player] ?? 0) + (a.count ?? 1); });

        const contrib = id => {
            const g = goalMap[id] ?? 0;
            const a = assistMap[id] ?? 0;
            const parts = [];
            if (g) parts.push(`${g}G`);
            if (a) parts.push(`${a}A`);
            return parts.length ? `<span class="ma-contrib">${parts.join(" ")}</span>` : "";
        };

        return `
        <div class="ma-section">
            <div class="ma-section-title">Player Spotlight</div>
            <div class="ma-stars">
                ${stars.map((p, i) => `
                <div class="ma-star-row ${i === 0 ? "ma-star-row--potm" : ""}">
                    ${i === 0 ? `<div class="ma-potm-render-wrap"><img src="assets/renders/${p.player}.png" class="ma-potm-render" alt="" onerror="this.parentElement.style.display='none'"></div>` : ""}
                    <div class="ma-star-info">
                        <span class="ma-star-name">${name(p.player)}</span>
                        ${contrib(p.player)}
                    </div>
                    <span class="md-rating ${ratingCls(p.rating)}">${p.rating.toFixed(1)}</span>
                </div>`).join("")}
            </div>
            ${worst && worst.rating < 6.5 ? `
            <div class="ma-concern">
                <span class="ma-concern-label">⚠️ Concern</span>
                <span class="ma-concern-name">${name(worst.player)}</span>
                <span class="md-rating rating--low">${worst.rating.toFixed(1)}</span>
            </div>` : ""}
        </div>`;
    };

    // ── Manager notes ─────────────────────────────────────────────
    const managerNotes = () => {
        const notes = [];
        const poss = t?.possession ?? 50;
        const avgR = avgRating ?? 0;

        if (match.result === "W" && diff >= 3) notes.push("Excellent collective effort — maintain this intensity.");
        if (match.result === "L")              notes.push("Requires immediate tactical review ahead of the next match.");
        if (ga >= 3)                           notes.push("Defensive shape must be tightened — too many goals conceded.");
        if (gf > 0 && t?.shots > 0 && gf / t.shots < 0.15) notes.push("Conversion rate below 15% — finishing needs work in training.");
        if (poss < 42)                         notes.push(`Only ${poss}% possession — focus on controlling the midfield.`);
        if (avgR >= 7.5)                       notes.push("Squad performed well individually — trust the system.");
        if (match.injuries?.length)            notes.push(`Monitor fitness: ${match.injuries.map(i => name(i.player)).join(", ")} picked up injuries.`);
        if (match.yellowCards?.length >= 2)    notes.push("Discipline was poor — work on reducing unnecessary bookings.");
        if (!notes.length)                     notes.push("Solid showing — focus on recovery and maintaining momentum.");

        return `
        <div class="ma-section">
            <div class="ma-section-title">📋 Manager Notes</div>
            <ul class="ma-notes">
                ${notes.map(n => `<li>${n}</li>`).join("")}
            </ul>
        </div>`;
    };

    return `
    <div class="ma-wrap">
        <!-- Verdict banner -->
        <div class="ma-verdict-banner" style="border-color:${resultColor}20;background:${resultColor}0d">
            <div class="ma-verdict-left">
                <span class="ma-result-pill" style="background:${resultColor}20;color:${resultColor}">${match.result === "W" ? "Victory" : match.result === "D" ? "Draw" : "Defeat"}</span>
                <p class="ma-verdict-text">${verdictText()}</p>
            </div>
            ${g ? `<div class="ma-grade" style="color:${g.col};border-color:${g.col}40">${g.letter}</div>` : ""}
        </div>

        ${tacticalInsights()}
        ${keyMomentsSection()}
        ${playerSpotlight()}
        ${managerNotes()}
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
