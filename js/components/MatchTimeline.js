// ==========================================
// CareerOS — Match Timeline
// ==========================================

import { getPlayerName } from "../utils/players.js";

const EVENT_CONFIG = {
    goal:   { icon: "⚽" },
    assist: { icon: "🎯" },
    yellow: { icon: "🟨" },
    red:    { icon: "🟥" },
    sub:    { icon: "🔄" },
    injury: { icon: "🤕" }
};

export function createMatchTimeline(match, players) {
    const events = collectEvents(match);
    if (!events.length) return "";

    const name = id => getPlayerName(id, players);

    return events.map(e => renderEvent(e, name)).join("");
}

// ── Event collection ─────────────────────────────────────────

function collectEvents(match) {
    const events = [];

    match.goals?.forEach(g =>
        events.push({ minute: g.minute, type: "goal", player: g.player }));

    match.assists?.forEach(a => {
        for (let i = 0; i < (a.count ?? 1); i++)
            events.push({ minute: null, type: "assist", player: a.player });
    });

    match.yellowCards?.forEach(c =>
        events.push({ minute: c.minute ?? null, type: "yellow", player: c.player }));

    match.redCards?.forEach(c =>
        events.push({ minute: c.minute ?? null, type: "red", player: c.player }));

    match.substitutions?.forEach(s =>
        events.push({ minute: s.minute, type: "sub", playerOn: s.playerOn, playerOff: s.playerOff }));

    match.injuries?.forEach(i =>
        events.push({ minute: i.minute, type: "injury", player: i.player, daysOut: i.daysOut }));

    return events.sort((a, b) => {
        if (a.minute === null && b.minute === null) return 0;
        if (a.minute === null) return 1;
        if (b.minute === null) return -1;
        return a.minute - b.minute;
    });
}

// ── Renderers ─────────────────────────────────────────────────

function renderEvent(event, name) {
    const { icon } = EVENT_CONFIG[event.type];
    const minute = event.minute != null ? `${event.minute}'` : "—";

    return `
    <div class="tl-event tl-event--${event.type}">
        <span class="tl-minute">${minute}</span>
        <span class="tl-icon">${icon}</span>
        <div class="tl-desc">${renderDescription(event, name)}</div>
    </div>`;
}

function renderDescription(event, name) {
    switch (event.type) {
        case "goal":
        case "yellow":
        case "red":
            return `<strong>${name(event.player)}</strong>`;

        case "assist":
            return `<span>${name(event.player)}</span>`;

        case "sub":
            return `
                <span class="tl-sub-on">▲ ${name(event.playerOn)}</span>
                <span class="tl-sub-off">▼ ${name(event.playerOff)}</span>`;

        case "injury":
            return `
                <strong>${name(event.player)}</strong>
                <span class="tl-badge--danger">${event.daysOut}d out</span>`;

        default:
            return "";
    }
}
