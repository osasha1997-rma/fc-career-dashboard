// ==========================================
// Career Hub
// Main Application
// Version 0.2.0 Beta
// ==========================================

import { loadAll } from "./api.js";

import {
    setHeader,
    renderScreen,
    hideLoadingScreen,
    setActiveNavigation
} from "./ui.js";

import { registerRoute, getRoute } from "./router.js";

import { renderDashboard } from "./dashboard.js";
import {
    renderSquad,
    initializeSquad
} from "./squad.js";
import { renderAnalytics, initializeAnalytics } from "./analytics.js";
import { renderTransfers, initializeTransfers } from "./transfers.js";
import { createCompetitions, initializeCompetitions } from "./competitions.js";
import { renderDevelopment } from "./development.js";
import { createCalendar, initializeCalendar } from "./calendar.js";
import { createPlayerProfile } from "./components/PlayerProfile.js";
import { renderSquadReport } from "./squadReport.js";
import { renderAIAssistant, initializeAIAssistant } from "./aiAssistant.js";
import { createMatchCentre,
    initializeMatchCentre,
    setSelectedMatch
 } from "./match-center.js";
import { deriveSeasonStats } from "./utils/stats.js";
import { initPlayers } from "./utils/players.js";
 
const state = {
    season: null,
    players: [],
    matches: [],
    standings: {},
    leagueStats: {},
    scoutReport: null,
    academy: [],
    selectedPlayer: null
};

registerRoute("dashboard", () => {
    const stats = deriveSeasonStats(state.matches, state.players);
    const played = state.matches.filter(m => m.result);
    const upcoming = state.matches.find(m => !m.result);
    const lastMatch = played.at(-1) ?? null;
    const season = {
        ...state.season,
        lastFixture: lastMatch ? {
            competition: lastMatch.competition,
            opponent:    lastMatch.opponent,
            venue:       lastMatch.venue,
            result:      lastMatch.result,
            score:       `${lastMatch.scoreFor}-${lastMatch.scoreAgainst}`
        } : state.season.lastFixture,
        nextFixture: upcoming ? {
            competition: upcoming.competition,
            opponent:    upcoming.opponent,
            venue:       upcoming.venue,
            date:        upcoming.date
        } : null
    };
    setHeader("Dashboard", state.season.club);
    return {
        html: renderDashboard(season, stats, state.matches, state.players),
        init: () => {
            // Show first upcoming card by default, then handle filter
            const showUpcoming = comp => {
                document.querySelectorAll(".db-upcoming").forEach(el => {
                    el.style.display = (comp === "all" || el.dataset.comp === comp) ? "" : "none";
                });
            };
            showUpcoming("all");

            document.querySelector(".db-fixture-filter")?.addEventListener("click", e => {
                const btn = e.target.closest(".db-fix-btn");
                if (!btn) return;
                document.querySelectorAll(".db-fix-btn").forEach(b => b.classList.toggle("active", b === btn));
                showUpcoming(btn.dataset.comp);
            });
        }
    };
});

registerRoute("squad", () => {
    setHeader("Squad", `${state.players.length} Players`);
    return {
        html: renderSquad(state.players),
        init: () => initializeSquad(openPlayerProfile)
    };
});

registerRoute("player-profile", () => {
    if (!state.selectedPlayer) {
        return getRoute("squad")();
    }

    setHeader(
        state.selectedPlayer.name,
        `${state.selectedPlayer.position} · #${state.selectedPlayer.number}`,
        `<button id="back-to-squad" class="back-btn">← Back</button>`
    );

    return {
        html: createPlayerProfile(state.selectedPlayer, state.matches),
        init: () => {
            document.getElementById("back-to-squad")?.addEventListener("click", () => {
                showScreen("squad");
            });
        }
    };
});

registerRoute("matches", () => {
    setHeader(
        "Match Centre",
        `${state.matches.filter(m => m.result).length} Matches`
    );

    return {
        html: createMatchCentre(state.matches, state.players),
        init: initializeMatchCentre
    };
});

registerRoute("competitions", () => {
    setHeader("Competitions", "2027/28");
    return {
        html: createCompetitions(state.matches, state.standings, state.leagueStats, state.season.club),
        init: initializeCompetitions
    };
});

registerRoute("calendar", () => {
    setHeader("Season Calendar", "2027/28");
    return {
        html: createCalendar(state.matches),
        init: () => initializeCalendar(id => { setSelectedMatch(id); showScreen("matches"); })
    };
});

registerRoute("analytics", () => {
    setHeader("Analytics", "2027/28");
    return {
        html: renderAnalytics(state.matches, state.players),
        init: initializeAnalytics
    };
});

registerRoute("transfers", () => {
    setHeader("Transfer Hub", "FC 26 Database");
    return {
        html: renderTransfers(state.players, state.matches, state.season),
        init: () => initializeTransfers(state.scoutReport)
    };
});

registerRoute("ai-assistant", () => {
    setHeader("AI Assistant", "2027/28");
    const html = renderAIAssistant(state.players, state.matches, state.scoutReport, state.season);
    return { html, init: () => initializeAIAssistant(state.players, state.matches, state.scoutReport, state.season) };
});

registerRoute("squad-report", () => {
    setHeader("Squad Report", "2027/28");
    return { html: renderSquadReport(state.scoutReport) };
});

registerRoute("development", () => {
    setHeader("Development", "2027/28");
    return { html: renderDevelopment(state.players, state.academy) };
});

async function showScreen(name) {
    const screen = getRoute(name);

    if (!screen) {
        console.error("Screen not found:", name);
        return;
    }

    const result = await screen();
    const html = typeof result === "string" ? result : result.html;
    const init = typeof result === "object" ? result.init : null;

    renderScreen(html, init);
    setActiveNavigation(name === "player-profile" ? "squad" : name);
}

function openPlayerProfile(playerId) {
    state.selectedPlayer = state.players.find(player => player.id === Number(playerId));

    if (state.selectedPlayer) {
        showScreen("player-profile");
    }
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.addEventListener("click", () => {
            showScreen(button.dataset.screen);
        });
    });
}

async function loadApplicationData() {
    const data = await loadAll();
    if (!data.season || !data.players || !data.matches) {
        throw new Error("Failed to load required data");
    }
    state.season      = data.season;
    state.players     = data.players;
    state.matches     = data.matches;
    state.standings   = data.standings   ?? {};
    state.leagueStats = data.leagueStats ?? {};
    state.scoutReport = data.scoutReport ?? null;
    state.academy     = data.academy     ?? [];
    initPlayers(data.players);
}

async function startApp() {
    try {
        await loadApplicationData();
        setupNavigation();
        hideLoadingScreen();
        showScreen("dashboard");
    } catch (err) {
        console.error(err);
        document.getElementById("loading-screen").innerHTML =
            `<div class="loader"><h1>⚽ CareerOS</h1><p style="color:var(--danger)">Failed to load data. Please refresh.</p></div>`;
    }
}

startApp();
