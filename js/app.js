// ==========================================
// Career Hub
// Main Application
// Version 0.1.0 Alpha
// ==========================================

import { loadSeason, loadPlayers, loadMatches } from "./api.js";

import {
    setHeader,
    renderScreen,
    hideLoadingScreen,
    setActiveNavigation
} from "./ui.js";

import { registerRoute, getRoute } from "./router.js";

import { renderDashboard } from "./dashboard.js";
import { renderSquad } from "./squad.js";
import { renderMatches } from "./matches.js";
import { renderAnalytics } from "./analytics.js";
import { renderDevelopment } from "./development.js";


// ==========================================
// Application State
// ==========================================

const state = {

    season: null,

    players: [],

    matches: []

};


// ==========================================
// Register Screens
// ==========================================

registerRoute("dashboard", () => {

    setHeader("Dashboard", state.season.club);

    return renderDashboard(state.season);

});

registerRoute("squad", () => {

    setHeader("Squad");

    return renderSquad(state.players);

});

registerRoute("matches", () => {

    setHeader("Matches");

    return renderMatches(state.matches);

});

registerRoute("analytics", () => {

    setHeader("Analytics");

    return renderAnalytics();

});

registerRoute("development", () => {

    setHeader("Development");

    return renderDevelopment();

});


// ==========================================
// Screen Navigation
// ==========================================

function showScreen(name){

    const screen = getRoute(name);

    if(!screen){

        console.error("Screen not found:",name);

        return;

    }

    renderScreen(screen());

    setActiveNavigation(name);

}


// ==========================================
// Bottom Navigation
// ==========================================

function setupNavigation(){

    document.querySelectorAll(".nav-btn").forEach(button=>{

        button.addEventListener("click",()=>{

            showScreen(button.dataset.screen);

        });

    });

}


// ==========================================
// Load Data
// ==========================================

async function loadApplicationData(){

    state.season = await loadSeason();

    state.players = await loadPlayers();

    state.matches = await loadMatches();

}


// ==========================================
// Application Start
// ==========================================

async function startApp(){

    await loadApplicationData();

    setupNavigation();

    showScreen("dashboard");

    hideLoadingScreen();

}

startApp();