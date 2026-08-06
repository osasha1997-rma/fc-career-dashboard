// Resolves a player ID to a display name.
// Falls back to the raw value so opponent string names (e.g. "Endrick") still render.
export function getPlayerName(id, players) {
    return players.find(p => p.id === id)?.name ?? String(id);
}
