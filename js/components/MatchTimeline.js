// ==========================================
// CareerOS — Match Timeline (vertical spine)
// ==========================================

import { getPlayerName } from "../utils/players.js";

const EVENT_CONFIG = {
    goal:     { icon: "⚽" },
    conceded: { icon: "⚽" },
    yellow:   { icon: "🟨" },
    red:      { icon: "🟥" },
    sub:      { icon: "🔄" },
    injury:   { icon: "🤕" }
};

export function createMatchTimeline(match, players) {
    const events = collectEvents(match);
    if (!events.length) return "";

    const name = id => getPlayerName(id, players);

    // Group by minute, sort descending (90 at top, 0 at bottom)
    const groups = groupByMinute(events);
    const sorted = [...groups.entries()].sort((a, b) => {
        if (a[0] === null) return 1;
        if (b[0] === null) return -1;
        return b[0] - a[0];
    });

    const rows = sorted.map(([minute, evts]) => renderRow(minute, evts, name)).join("");

    return `
    <div class="tl-spine">
        <div class="tl-cap tl-cap--top">90'</div>
        ${rows}
        <div class="tl-cap tl-cap--bottom">0'</div>
    </div>`;
}

// ── Grouping ─────────────────────────────────────────────────

function groupByMinute(events) {
    const map = new Map();
    for (const e of events) {
        const key = e.minute ?? null;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(e);
    }
    return map;
}

// ── Row renderer ──────────────────────────────────────────────

function renderRow(minute, evts, name) {
    const home = evts.filter(e => e.side === "home");
    const away = evts.filter(e => e.side === "away");

    const homeHtml = home.map(e => renderChip(e, name, "home")).join("");
    const awayHtml = away.map(e => renderChip(e, name, "away")).join("");
    const minLabel = minute != null ? `${minute}'` : "—";

    return `
    <div class="tl-row">
        <div class="tl-side tl-side--home">${homeHtml}</div>
        <div class="tl-node">
            <div class="tl-dot"></div>
            <span class="tl-min">${minLabel}</span>
        </div>
        <div class="tl-side tl-side--away">${awayHtml}</div>
    </div>`;
}

function renderChip(event, name, side) {
    const { icon } = EVENT_CONFIG[event.type] ?? { icon: "•" };
    const label = renderLabel(event, name, side);
    return `<div class="tl-chip tl-chip--${event.type}">${side === "home" ? `${label} ${icon}` : `${icon} ${label}`}</div>`;
}

function renderLabel(event, name, side) {
    switch (event.type) {
        case "goal":
            return `<strong>${name(event.player)}</strong>`;
        case "conceded":
            return `<span>${event.player}</span>`;
        case "yellow":
        case "red":
            return `<span>${name(event.player)}</span>`;
        case "sub":
            return `<span class="tl-sub-on">▲${name(event.playerOn)}</span><span class="tl-sub-off"> ▼${name(event.playerOff)}</span>`;
        case "injury":
            return `<span>${name(event.player)}</span>`;
        default:
            return "";
    }
}

// ── Event collection ─────────────────────────────────────────

function collectEvents(match) {
    const events = [];

    match.goals?.forEach(g =>
        events.push({ minute: g.minute ?? null, type: "goal", player: g.player, side: "home" }));

    match.goalsConceded?.forEach(g =>
        events.push({ minute: g.minute ?? null, type: "conceded", player: g.scorer ?? g.player ?? "Unknown", side: "away" }));

    match.yellowCards?.forEach(c =>
        events.push({ minute: c.minute ?? null, type: "yellow", player: c.player, side: "home" }));

    match.redCards?.forEach(c =>
        events.push({ minute: c.minute ?? null, type: "red", player: c.player, side: "home" }));

    match.substitutions?.forEach(s =>
        events.push({ minute: s.minute ?? null, type: "sub", playerOn: s.playerOn, playerOff: s.playerOff, side: "home" }));

    match.injuries?.forEach(i =>
        events.push({ minute: i.minute ?? null, type: "injury", player: i.player, side: "home" }));

    return events;
}
