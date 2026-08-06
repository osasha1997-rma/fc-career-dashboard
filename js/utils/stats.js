// ==========================================
// CareerOS — Derived Season Stats
// All values computed from matches.json.
// No calculated values are ever stored.
// ==========================================

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

    // ── Per-player accumulators (numeric IDs only) ──────────────
    const goalMap   = {};   // { id: totalGoals }
    const assistMap = {};   // { id: totalAssists }
    const ratingMap = {};   // { id: [r1, r2, ...] }

    played.forEach(m => {
        m.goals?.forEach(g => {
            if (typeof g.player === "number")
                goalMap[g.player] = (goalMap[g.player] ?? 0) + 1;
        });
        m.assists?.forEach(a => {
            if (typeof a.player === "number")
                assistMap[a.player] = (assistMap[a.player] ?? 0) + (a.count ?? 1);
        });
        m.performances?.forEach(p => {
            if (typeof p.player === "number") {
                if (!ratingMap[p.player]) ratingMap[p.player] = [];
                ratingMap[p.player].push(p.rating);
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
    const resolveName = id => players.find(p => p.id === Number(id))?.name ?? String(id);
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
        topScorer:    tScorerEntry ? { name: resolveName(tScorerEntry[0]), goals:   tScorerEntry[1] } : null,
        topAssists:   tAssistEntry ? { name: resolveName(tAssistEntry[0]), assists: tAssistEntry[1] } : null,
        topRated:     tRatedEntry  ? { name: resolveName(tRatedEntry[0]),  rating:  avgRatingMap[tRatedEntry[0]].toFixed(2) } : null,
        avgTeamRating
    };
}
