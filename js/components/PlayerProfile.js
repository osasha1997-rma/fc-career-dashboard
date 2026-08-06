// ==========================================
// CareerOS — Player Profile Component
// ==========================================

import { getCompetitionLabel } from "../utils/competitions.js";

export function createPlayerProfile(player, matches = []) {
    const stats = computeStats(player.id, matches);
    const secondaryPositions = player.secondaryPositions?.join(", ") || "None";

    return `
    <section class="player-profile fade">

        <div class="player-profile-header">
            <div class="player-overall">${player.overall}</div>
            <h1>${player.name}</h1>
            <p>#${player.number} &middot; ${player.position}</p>
            <p>${player.nationality}</p>
        </div>

        <div class="profile-section">
            <h2>Overview</h2>
            <div class="profile-grid">
                ${profileItem("Age",            player.age)}
                ${profileItem("Overall",        player.overall)}
                ${profileItem("Potential",      player.potential)}
                ${profileItem("Preferred Foot", player.preferredFoot)}
                ${profileItem("Role",           player.role)}
            </div>
        </div>

        <div class="profile-section">
            <h2>Season Statistics</h2>
            <div class="profile-grid">
                ${profileItem("Starts",         stats.starts)}
                ${profileItem("Sub Apps",       stats.subApps)}
                ${profileItem("Goals",          stats.goals)}
                ${profileItem("Assists",        stats.assists)}
                ${profileItem("Minutes",        stats.minutes)}
                ${profileItem("Avg Rating",     stats.avgRating)}
            </div>
        </div>

        <div class="profile-section">
            <h2>Recent Form</h2>
            <div class="form-list">
                ${stats.recentForm.length
                    ? stats.recentForm.map(r => `
                        <span class="form-rating ${r >= 8 ? "excellent" : r >= 7 ? "good" : "average"}">${r.toFixed(1)}</span>
                    `).join("")
                    : `<p class="no-data">No appearances yet</p>`}
            </div>
        </div>

        <div class="profile-section">
            <h2>Season Breakdown</h2>
            <div class="competition-list">
                ${renderCompBreakdown(stats.byComp)}
            </div>
        </div>

        <div class="profile-section">
            <h2>Career Information</h2>
            <div class="profile-grid">
                ${profileItem("Nationality",          player.nationality)}
                ${profileItem("Primary Position",     player.position)}
                ${profileItem("Secondary Positions",  secondaryPositions)}
                ${profileItem("Captaincy",            player.captain ? "Captain" : player.viceCaptain ? "Vice Captain" : "No")}
                ${profileItem("Contract",             "2032")}
                ${profileItem("Status",               "Available")}
            </div>
        </div>

    </section>`;
}

// ── Stats computation ─────────────────────────────────────────

function computeStats(id, matches) {
    const played  = matches.filter(m => m.result);
    const byComp  = {};   // { slug: { apps, starts, goals, assists, ratings[] } }
    const allRatings = [];
    let totalMinutes = 0;

    for (const match of played) {
        const inXI    = match.startingXI?.includes(id);
        const subOn   = match.substitutions?.find(s => s.playerOn  === id);
        const subOff  = match.substitutions?.find(s => s.playerOff === id);
        const perf    = match.performances?.find(p => p.player     === id);

        let isStart = false;
        let isSub   = false;
        let mins    = 0;

        if (inXI) {
            isStart = true;
            mins    = subOff ? subOff.minute : 90;
        } else if (subOn) {
            isSub = true;
            mins  = 90 - subOn.minute;
        } else if (perf) {
            // has a rating but squad data is ambiguous — treat as starter
            isStart = true;
            mins    = 90;
        }

        if (!isStart && !isSub) continue;

        totalMinutes += mins;
        if (perf) allRatings.push(perf.rating);

        const c = compBucket(byComp, match.competition);
        c.apps++;
        if (isStart) c.starts++;
        if (perf) c.ratings.push(perf.rating);

        for (const g of match.goals ?? [])   if (g.player  === id) c.goals++;
        for (const a of match.assists ?? []) if (a.player  === id) c.assists += a.count ?? 1;
    }

    // Seal buckets with computed averages
    Object.values(byComp).forEach(c => {
        c.avgRating = avgOf(c.ratings);
    });

    const totals = Object.values(byComp).reduce(
        (acc, c) => ({
            apps:    acc.apps    + c.apps,
            starts:  acc.starts  + c.starts,
            goals:   acc.goals   + c.goals,
            assists: acc.assists  + c.assists
        }),
        { apps: 0, starts: 0, goals: 0, assists: 0 }
    );

    return {
        starts:     totals.starts,
        subApps:    totals.apps - totals.starts,
        goals:      totals.goals,
        assists:    totals.assists,
        minutes:    totalMinutes,
        avgRating:  avgOf(allRatings),
        recentForm: [...allRatings].reverse(),
        byComp
    };
}

// ── Render helpers ────────────────────────────────────────────

function renderCompBreakdown(byComp) {
    const entries = Object.entries(byComp);
    if (!entries.length) return `<p class="no-data">No appearances yet</p>`;

    return entries.map(([slug, c]) => `
        <div class="competition-row">
            <strong>${getCompetitionLabel(slug)}</strong>
            <span>${c.apps} apps &middot; ${c.goals}g &middot; ${c.assists}a &middot; ${c.avgRating}</span>
        </div>`).join("");
}

function profileItem(label, value) {
    return `
    <div class="profile-item">
        <span>${label}</span>
        <strong>${value ?? "—"}</strong>
    </div>`;
}

// ── Utilities ─────────────────────────────────────────────────

function compBucket(map, slug) {
    if (!map[slug]) map[slug] = { apps: 0, starts: 0, goals: 0, assists: 0, ratings: [] };
    return map[slug];
}

function avgOf(arr) {
    return arr.length
        ? (arr.reduce((s, r) => s + r, 0) / arr.length).toFixed(1)
        : "—";
}
