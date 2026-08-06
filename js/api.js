// ==========================================
// CareerOS — Data API
// ==========================================

async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
}

export async function loadAll() {
    const [season, players, matches] = await Promise.all([
        loadJson("data/season.json"),
        loadJson("data/players.json"),
        loadJson("data/matches.json")
    ]);
    return { season, players, matches };
}
