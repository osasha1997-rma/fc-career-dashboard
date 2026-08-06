// ==========================================
// CareerOS — Match Centre
// ==========================================

import { createMatchDetails } from "./components/MatchDetail.js";
import { getCompetitionLabel } from "./utils/competitions.js";

let selectedMatchId = null;
let _matches = [];
let _players = [];

export function createMatchCentre(matches = [], players = []) {
    _matches = matches;
    _players = players;

    const sorted = [...matches].sort((a, b) => b.id - a.id);
    const upcoming = [...matches].sort((a, b) => a.id - b.id).find(m => !m.result) ?? null;
    const completed = sorted.filter(m => m.result);

    if (!selectedMatchId && completed.length) {
        selectedMatchId = completed[0].id;
    }

    const selectedMatch = completed.find(m => m.id === selectedMatchId) ?? null;

    return `
    <section class="match-centre fade">

        <div class="page-header">
            <h1>Match Centre</h1>
            <p>Season 2027/28</p>
        </div>

        ${upcoming ? createUpcomingFixture(upcoming) : ""}

        <div class="results-header">Recent Results</div>

        <div class="match-list">
            ${completed.map(m => createMatchCard(m, m.id === selectedMatchId)).join("")}
        </div>

        <div id="match-detail">
            ${createMatchDetails(selectedMatch, players)}
        </div>

    </section>`;
}

export function initializeMatchCentre() {
    const list = document.querySelector(".match-list");
    if (!list) return;

    list.addEventListener("click", e => {
        const card = e.target.closest(".match-card");
        if (!card) return;

        const id = Number(card.dataset.matchId);
        if (id === selectedMatchId) return;

        selectedMatchId = id;

        // Update active state on cards without touching the rest of the DOM
        list.querySelectorAll(".match-card").forEach(c => {
            c.classList.toggle("active", Number(c.dataset.matchId) === id);
        });

        // Swap only the detail panel
        const match = _matches.find(m => m.id === id) ?? null;
        document.getElementById("match-detail").innerHTML =
            createMatchDetails(match, _players);
    });
}

function createUpcomingFixture(match) {
    return `
    <div class="upcoming-card">
        <h2>Next Fixture</h2>
        <div class="fixture-competition">${getCompetitionLabel(match.competition)}</div>
        <h3>Real Madrid vs ${match.opponent}</h3>
        <p>${match.venue}</p>
        <p>${match.date ?? "TBD"}</p>
    </div>`;
}

function createMatchCard(match, isActive) {
    return `
    <div class="match-card ${getResultClass(match.result)}${isActive ? " active" : ""}"
         data-match-id="${match.id}">
        <div class="match-top">
            <span>${getCompetitionLabel(match.competition)}</span>
            <span>MD ${match.matchday}</span>
        </div>
        <h3>Real Madrid ${match.scoreFor}-${match.scoreAgainst} ${match.opponent}</h3>
        <p>${match.venue}</p>
        <span class="match-result-badge match-result-badge--${getResultClass(match.result)}">${match.result}</span>
    </div>`;
}

function getResultClass(result) {
    return { W: "win", D: "draw", L: "loss" }[result] ?? "";
}
