// ==========================================
// CareerOS — Player Profile 2.0
// ==========================================

import { getCompetitionLabel } from "../utils/competitions.js";

const RENDER_PATH = "assets/renders/";

export function createPlayerProfile(player, matches = []) {
    const stats = computeStats(player.id, matches);

    return `
    <section class="player-profile fade">

        <div class="player-profile-header">
            <div class="player-render-wrap">
                <img src="${RENDER_PATH}${player.id}.png" class="player-render" alt="${player.name}"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="player-render-fallback" style="display:none">
                    <span class="player-overall">${player.overall}</span>
                </div>
            </div>
            <div class="player-overall-badge">${player.overall}</div>
            <h1>${player.name}</h1>
            <p>#${player.number} &middot; ${player.position}</p>
            <p>${player.nationality}</p>
        </div>

        ${renderSummaryPills(stats)}
        ${renderCompBreakdown(stats.byComp)}
        ${renderRatingChart(stats.appearances)}
        ${renderRecentForm(stats.appearances)}
        ${renderDiscipline(stats)}
        ${renderInjuries(stats.injuries)}
        ${renderCareerInfo(player)}

    </section>`;
}

// ── Stats computation ──────────────────────────────────────────

function computeStats(id, matches) {
    const played  = matches.filter(m => m.result);
    const byComp  = {};
    const appearances = [];
    let totalMinutes = 0;
    let totalYellow  = 0;
    let totalRed     = 0;
    const injuries   = [];

    for (const match of played) {
        const inXI   = match.startingXI?.includes(id);
        const subOn  = match.substitutions?.find(s => s.playerOn  === id);
        const subOff = match.substitutions?.find(s => s.playerOff === id);
        const perf   = match.performances?.find(p => p.player     === id);

        const isStart = !!inXI;
        const isSub   = !inXI && !!subOn;

        if (!isStart && !isSub) continue;

        const minsOn  = isStart ? (subOff ? subOff.minute : 90) : (90 - subOn.minute);
        totalMinutes += minsOn;

        const goals   = (match.goals   ?? []).filter(g => g.player === id).length;
        const assists = (match.assists  ?? []).filter(a => a.player === id).reduce((s, a) => s + (a.count ?? 1), 0);
        const yellow  = (match.yellowCards ?? []).filter(c => c.player === id).length;
        const red     = (match.redCards    ?? []).filter(c => c.player === id).length;
        totalYellow  += yellow;
        totalRed     += red;

        for (const inj of (match.injuries ?? [])) {
            if (inj.player === id) injuries.push({ match, ...inj });
        }

        const c = compBucket(byComp, match.competition);
        c.apps++;
        if (isStart) c.starts++;
        c.goals   += goals;
        c.assists += assists;
        c.minutes += minsOn;
        if (perf) c.ratings.push(perf.rating);

        appearances.push({
            matchId:    match.id,
            opponent:   match.opponent,
            competition: match.competition,
            result:     match.result,
            date:       match.date,
            isStart,
            minutes:    minsOn,
            goals,
            assists,
            yellow,
            red,
            rating:     perf?.rating ?? null
        });
    }

    Object.values(byComp).forEach(c => {
        c.avgRating = c.ratings.length
            ? (c.ratings.reduce((s, r) => s + r, 0) / c.ratings.length).toFixed(1)
            : null;
    });

    const totals = Object.values(byComp).reduce(
        (acc, c) => ({ apps: acc.apps + c.apps, starts: acc.starts + c.starts,
                        goals: acc.goals + c.goals, assists: acc.assists + c.assists }),
        { apps: 0, starts: 0, goals: 0, assists: 0 }
    );

    const allRatings  = appearances.filter(a => a.rating).map(a => a.rating);
    const avgRating   = allRatings.length
        ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
        : null;

    return {
        ...totals,
        subApps:     totals.apps - totals.starts,
        minutes:     totalMinutes,
        avgRating,
        yellowCards: totalYellow,
        redCards:    totalRed,
        byComp,
        appearances,
        injuries
    };
}

// ── Render sections ────────────────────────────────────────────

function renderSummaryPills(s) {
    if (!s.apps) return `<div class="pp-empty">No appearances this season.</div>`;
    const pills = [
        { v: s.apps,           l: "Apps" },
        { v: `${s.starts}/${s.subApps}`, l: "Start/Sub" },
        { v: s.goals,          l: "Goals" },
        { v: s.assists,        l: "Assists" },
        { v: s.minutes + "'",  l: "Minutes" },
        { v: s.avgRating ?? "—", l: "Avg Rating" },
    ];
    return `
    <div class="pp-pills">
        ${pills.map(p => `
        <div class="pp-pill">
            <span class="pp-pill-v">${p.v}</span>
            <span class="pp-pill-l">${p.l}</span>
        </div>`).join("")}
    </div>`;
}

function renderCompBreakdown(byComp) {
    const entries = Object.entries(byComp);
    if (!entries.length) return "";
    return `
    <div class="pp-section">
        <div class="pp-section-title">By Competition</div>
        <div class="pp-comp-table">
            <div class="pp-comp-row pp-comp-header">
                <span>Competition</span><span>Apps</span><span>G</span><span>A</span><span>Mins</span><span>Avg</span>
            </div>
            ${entries.map(([slug, c]) => `
            <div class="pp-comp-row">
                <span>${getCompetitionLabel(slug)}</span>
                <span>${c.starts}<small>+${c.apps - c.starts}</small></span>
                <span>${c.goals}</span>
                <span>${c.assists}</span>
                <span>${c.minutes}'</span>
                <span class="pp-rating-val">${c.avgRating ?? "—"}</span>
            </div>`).join("")}
        </div>
    </div>`;
}

function shortOpp(name) {
    const SKIP = new Set(["Real","RCD","SD","FC","CA","CF","GNK","SL","UD","de"]);
    const word = name.split(" ").find(w => !SKIP.has(w)) ?? name;
    return word.slice(0, 5);
}

function renderRatingChart(appearances) {
    const rated = appearances.filter(a => a.rating !== null);
    if (rated.length < 2) return "";
    const max = 10;
    return `
    <div class="pp-section">
        <div class="pp-section-title">Rating per Appearance</div>
        <div class="pp-chart">
            ${rated.map(a => {
                const pct = (a.rating / max * 100).toFixed(1);
                const cls = a.rating >= 8 ? "excellent" : a.rating >= 7 ? "good" : a.rating >= 6 ? "average" : "poor";
                return `
                <div class="pp-bar-wrap" title="${a.opponent} — ${a.rating}">
                    <div class="pp-bar pp-bar--${cls}" style="height:${pct}%"></div>
                    <span class="pp-bar-label">${a.rating}</span>
                    <span class="pp-bar-opp">${shortOpp(a.opponent)}</span>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

function renderRecentForm(appearances) {
    const recent = [...appearances].reverse().slice(0, 6);
    if (!recent.length) return "";
    return `
    <div class="pp-section">
        <div class="pp-section-title">Recent Form</div>
        <div class="pp-form-list">
            ${recent.map(a => {
                const rCls = a.result === "W" ? "win" : a.result === "D" ? "draw" : "loss";
                const rating = a.rating != null
                    ? `<span class="pp-form-rating ${a.rating >= 8 ? "excellent" : a.rating >= 7 ? "good" : "average"}">${a.rating}</span>`
                    : `<span class="pp-form-rating average">—</span>`;
                const extras = [
                    a.goals   ? `⚽×${a.goals}`   : "",
                    a.assists ? `🎯×${a.assists}` : "",
                    a.yellow  ? `🟨`              : "",
                    a.red     ? `🟥`              : "",
                ].filter(Boolean).join(" ");
                return `
                <div class="pp-form-row">
                    <span class="pp-form-badge pp-form-badge--${rCls}">${a.result}</span>
                    <div class="pp-form-info">
                        <span class="pp-form-opp">${a.opponent}</span>
                        <span class="pp-form-meta">${a.isStart ? "Start" : "Sub"} · ${a.minutes}' ${extras}</span>
                    </div>
                    ${rating}
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

function renderDiscipline(s) {
    if (!s.yellowCards && !s.redCards) return "";
    return `
    <div class="pp-section">
        <div class="pp-section-title">Discipline</div>
        <div class="pp-discipline">
            <div class="pp-disc-item">
                <span class="pp-disc-card pp-disc-card--yellow"></span>
                <span>${s.yellowCards} Yellow</span>
            </div>
            <div class="pp-disc-item">
                <span class="pp-disc-card pp-disc-card--red"></span>
                <span>${s.redCards} Red</span>
            </div>
        </div>
    </div>`;
}

function renderInjuries(injuries) {
    if (!injuries.length) return "";
    return `
    <div class="pp-section">
        <div class="pp-section-title">Injuries</div>
        <div class="pp-injury-list">
            ${injuries.map(i => `
            <div class="pp-injury-row">
                <span class="pp-injury-icon">🤕</span>
                <div class="pp-injury-info">
                    <span>vs ${i.match.opponent}</span>
                    <span class="pp-injury-meta">Min ${i.minute ?? "?"} · ${i.daysOut} days out</span>
                </div>
            </div>`).join("")}
        </div>
    </div>`;
}

function renderCareerInfo(player) {
    const sec = player.secondaryPositions?.join(", ") || "None";
    const items = [
        { l: "Age",                v: player.age },
        { l: "Overall",            v: player.overall },
        { l: "Potential",          v: player.potential },
        { l: "Preferred Foot",     v: player.preferredFoot },
        { l: "Role",               v: player.role },
        { l: "Primary Position",   v: player.position },
        { l: "Secondary Positions",v: sec },
        { l: "Captaincy",          v: player.captain ? "Captain" : player.viceCaptain ? "Vice Captain" : "No" },
        ...(player.loan       ? [{ l: "On Loan At",    v: player.loanClub    ?? "Unknown" }] : []),
        ...(player.loanedFrom ? [{ l: "Loaned From",   v: player.loanedFrom                }] : []),
    ];
    return `
    <div class="pp-section">
        <div class="pp-section-title">Player Info</div>
        <div class="profile-grid">
            ${items.map(i => `
            <div class="profile-item">
                <span>${i.l}</span>
                <strong>${i.v ?? "—"}</strong>
            </div>`).join("")}
        </div>
    </div>`;
}

// ── Utilities ──────────────────────────────────────────────────

function compBucket(map, slug) {
    if (!map[slug]) map[slug] = { apps: 0, starts: 0, goals: 0, assists: 0, minutes: 0, ratings: [] };
    return map[slug];
}
