// Singleton player registry — call initPlayers() once at app startup.
// getPlayerName(id) resolves from internal state everywhere.

let _players = [];

export function initPlayers(arr) {
    _players = arr ?? [];
}

// Second arg accepted for legacy call sites but ignored.
export function getPlayerName(id, _ignored) {
    if (typeof id === "string" && isNaN(Number(id))) return id; // already a name string
    const p = _players.find(p => p.id === Number(id));
    return p ? p.name : String(id);
}
