// ==========================================
// CareerOS — Data API
// ==========================================

async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
}

export async function loadAll() {
    const [season, players, matches, standings, leagueStats] = await Promise.all([
        loadJson("data/season.json"),
        loadJson("data/players.json"),
        loadJson("data/matches.json"),
        loadJson("data/standings.json").catch(() => ({})),
        loadJson("data/leagueStats.json").catch(() => ({}))
    ]);
    return { season, players, matches, standings, leagueStats };
}
