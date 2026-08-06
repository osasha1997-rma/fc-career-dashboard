// ==========================================
// Career Hub
// Main Application
// Version 0.1.0 Alpha
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
import { renderAnalytics } from "./analytics.js";
import { renderDevelopment } from "./development.js";
import { createPlayerProfile } from "./components/PlayerProfile.js";
import { createMatchCentre,
    initializeMatchCentre
 } from "./match-center.js";
import { deriveSeasonStats } from "./utils/stats.js";
 
const state = {
    season: null,
    players: [],
    matches: [],
    selectedPlayer: null
};

registerRoute("dashboard", () => {
    const stats = deriveSeasonStats(state.matches, state.players);
    setHeader("Dashboard", state.season.club);
    return renderDashboard(state.season, stats);
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

registerRoute("analytics", () => {
    setHeader("Analytics");
    return renderAnalytics();
});

registerRoute("development", () => {
    setHeader("Development");
    return renderDevelopment();
});

function showScreen(name) {
    const screen = getRoute(name);

    if (!screen) {
        console.error("Screen not found:", name);
        return;
    }

    const result = screen();
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
    state.season  = data.season;
    state.players = data.players;
    state.matches = data.matches;
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
