// ==========================================
// Career Hub API
// Loads local JSON data
// ==========================================

async function loadJson(path) {
    try {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
        }

        return await response.json();

    } catch (error) {

        console.error(error);

        return null;
    }
}

export async function loadSeason() {
    return await loadJson("data/season.json");
}

export async function loadPlayers() {
    return await loadJson("data/players.json");
}

export async function loadMatches() {
    return await loadJson("data/matches.json");
}