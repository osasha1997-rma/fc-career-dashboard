// ==========================================
// CareerOS — Derived Stats
// All values computed from matches.json.
// No calculated values are ever stored.
// ==========================================

// Match data can contain player IDs as either numbers or strings.
// Normalize comparisons so derived player stats remain reliable.
const samePlayerId = (a, b) => String(a) === String(b);

export function deriveSeasonStats(matches, players = []) {
    const played = matches.filter(m => m.result);

    // ── Basic record ────────────────────────────────────────────
    const wins         = played.filter(m => m.result === "W").length;
    const draws        = played.filter(m => m.result === "D").length;
    const losses       = played.filter(m => m.result === "L").length;
    const goalsFor     = played.reduce((s, m) => s + (m.scoreFor ?? 0), 0);
    const goalsAgainst = played.reduce((s, m) => s + (m.scoreAgainst ?? 0), 0);
    const cleanSheets  = played.filter(m => (m.scoreAgainst ?? 1) === 0).length;

    // ── Possession (average across matches that have the data) ──
    const posMatches = played.filter(m => m.teamStats?.possession != null);
    const avgPossession = posMatches.length
        ? Math.round(posMatches.reduce((s, m) => s + m.teamStats.possession, 0) / posMatches.length)
        : null;

    // ── Per-player accumulators ─────────────────────────────────
    const goalMap   = {};
    const assistMap = {};
    const ratingMap = {};

    played.forEach(m => {
        m.goals?.forEach(g => {
            const player = players.find(p => samePlayerId(p.id, g.player));
            if (player)
                goalMap[player.id] = (goalMap[player.id] ?? 0) + 1;
        });
        m.assists?.forEach(a => {
            const player = players.find(p => samePlayerId(p.id, a.player));
            if (player)
                assistMap[player.id] = (assistMap[player.id] ?? 0) + (a.count ?? 1);
        });
        m.performances?.forEach(p => {
            const player = players.find(x => samePlayerId(x.id, p.player));
            if (player) {
                if (!ratingMap[player.id]) ratingMap[player.id] = [];
                ratingMap[player.id].push(p.rating);
            }
        });
    });

    // ── Average ratings per player ──────────────────────────────
    const avgRatingMap = {};
    Object.entries(ratingMap).forEach(([id, rs]) => {
        avgRatingMap[id] = rs.reduce((s, r) => s + r, 0) / rs.length;
    });

    // ── Team average rating (all appearances) ──────────────────
    const allRatings   = Object.values(ratingMap).flat();
    const avgTeamRating = allRatings.length
        ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(2)
        : null;

    // ── Helpers ─────────────────────────────────────────────────
    const resolveName = id => players.find(p => samePlayerId(p.id, id))?.name ?? String(id);
    const topOf = map => {
        const entries = Object.entries(map);
        if (!entries.length) return null;
        return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
    };

    const tScorerEntry = topOf(goalMap);
    const tAssistEntry = topOf(assistMap);
    const tRatedEntry  = topOf(avgRatingMap);

    return {
        played:       played.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        cleanSheets,
        avgPossession,
        topScorer:    tScorerEntry ? { id: tScorerEntry[0], name: resolveName(tScorerEntry[0]), goals:   tScorerEntry[1] } : null,
        topAssists:   tAssistEntry ? { id: tAssistEntry[0], name: resolveName(tAssistEntry[0]), assists: tAssistEntry[1] } : null,
        topRated:     tRatedEntry  ? { id: tRatedEntry[0],  name: resolveName(tRatedEntry[0]),  rating:  avgRatingMap[tRatedEntry[0]].toFixed(2) } : null,
        avgTeamRating
    };
}

// ── Per-player stats (derived from match data) ──────────────────
// Returns all match-level statistics for a single player.
// Used by PlayerProfile, AI Assistant, and Analytics.

export function derivePlayerStats(player, matches) {
    const id     = player.id;
    const played = matches.filter(m => m.result);
    const byComp = {};
    const appearanceList = [];
    let totalMinutes = 0;
    let totalYellow  = 0;
    let totalRed     = 0;
    const injuries   = [];

    for (const match of played) {
        const inXI   = match.startingXI?.some(x => samePlayerId(x, id));
        const subOn  = match.substitutions?.find(s => samePlayerId(s.playerOn, id));
        const subOff = match.substitutions?.find(s => samePlayerId(s.playerOff, id));
        const perf   = match.performances?.find(p => samePlayerId(p.player, id));

        const isStart = !!inXI;
        const isSub   = !inXI && !!subOn;
        if (!isStart && !isSub) continue;

        const minsOn  = isStart ? (subOff ? subOff.minute : 90) : (90 - subOn.minute);
        totalMinutes += minsOn;

        const goals   = (match.goals      ?? []).filter(g => samePlayerId(g.player, id)).length;
        const assists = (match.assists     ?? []).filter(a => samePlayerId(a.player, id)).reduce((s, a) => s + (a.count ?? 1), 0);
        const yellow  = (match.yellowCards ?? []).filter(c => samePlayerId(c.player, id)).length;
        const red     = (match.redCards    ?? []).filter(c => samePlayerId(c.player, id)).length;
        totalYellow  += yellow;
        totalRed     += red;

        for (const inj of (match.injuries ?? [])) {
            if (samePlayerId(inj.player, id)) injuries.push({ match, ...inj });
        }

        if (!byComp[match.competition]) {
            byComp[match.competition] = { apps: 0, starts: 0, goals: 0, assists: 0, minutes: 0, ratings: [] };
        }
        const c = byComp[match.competition];
        c.apps++;
        if (isStart) c.starts++;
        c.goals   += goals;
        c.assists += assists;
        c.minutes += minsOn;
        if (perf && typeof perf.rating === "number") c.ratings.push(perf.rating);

        appearanceList.push({
            matchId:     match.id,
            opponent:    match.opponent,
            competition: match.competition,
            result:      match.result,
            date:        match.date,
            isStart,
            minutes:     minsOn,
            goals,
            assists,
            yellow,
            red,
            rating:      perf?.rating ?? null
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

    const allRatings = appearanceList
        .filter(a => a.rating != null)
        .map(a => a.rating);
    const avgRating  = allRatings.length
        ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
        : null;

    return {
        // Canonical shape (as per spec)
        goals:                 totals.goals,
        assists:               totals.assists,
        appearances:           totals.apps,
        starts:                totals.starts,
        substituteAppearances: totals.apps - totals.starts,
        minutes:               totalMinutes,
        averageRating:         avgRating,
        // Aliases used by PlayerProfile UI
        apps:     totals.apps,
        subApps:  totals.apps - totals.starts,
        avgRating,
        yellowCards:    totalYellow,
        redCards:       totalRed,
        byComp,
        appearanceList,
        injuries
    };
}
