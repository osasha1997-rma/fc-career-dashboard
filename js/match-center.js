// ==========================================
// CareerOS — Match Centre
// ==========================================

import { createMatchDetails } from "./components/MatchDetail.js";
import { getCompetitionLabel, getCompetitionColor, shortOpp } from "./utils/competitions.js";

let selectedMatchId = null;
let _matches = [];
let _players = [];
let _compFilter = "all";

export function setSelectedMatch(id) {
    if (typeof id === "number") selectedMatchId = id;
}

export function createMatchCentre(matches = [], players = []) {
    _matches = matches;
    _players = players;

    const sorted   = [...matches].sort((a, b) => b.id - a.id);
    const upcoming = [...matches].sort((a, b) => a.id - b.id).find(m => !m.result) ?? null;
    const completed = sorted.filter(m => m.result);

    // Build unique competition list
    const comps = ["all", ...new Set(completed.map(m => m.competition))];

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

        <div class="upcoming-card-wrap">${upcoming ? createUpcomingFixture(upcoming) : ""}</div>

        <div class="mc-comp-filter">
            ${comps.map(c => `
            <button class="mc-comp-btn${c === _compFilter ? " active" : ""}" data-comp="${c}">
                ${c === "all" ? "All" : getCompetitionLabel(c)}
            </button>`).join("")}
        </div>

        <div class="results-header">Recent Results</div>

        <div class="match-list">
            ${completed.map(m => createMatchCard(m, m.id === selectedMatchId)).join("")}
        </div>

        <div id="match-detail">
            ${createMatchDetails(selectedMatch, players)}
        </div>

    </section>`;
}

function setupTabs(detailEl) {
    detailEl.querySelectorAll(".md-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const tabName = tab.dataset.tab;
            detailEl.querySelectorAll(".md-tab").forEach(t =>
                t.classList.toggle("active", t === tab));
            detailEl.querySelectorAll(".md-tab-content").forEach(c =>
                c.classList.toggle("md-tab-hidden", c.dataset.content !== tabName));
        });
    });
}

export function initializeMatchCentre() {
    const detailEl = document.getElementById("match-detail");
    setupTabs(detailEl);

    // Competition filter
    document.querySelector(".mc-comp-filter")?.addEventListener("click", e => {
        const btn = e.target.closest(".mc-comp-btn");
        if (!btn) return;
        _compFilter = btn.dataset.comp;

        document.querySelectorAll(".mc-comp-btn").forEach(b =>
            b.classList.toggle("active", b === btn));

        const completed = [..._matches]
            .sort((a, b) => b.id - a.id)
            .filter(m => m.result && (_compFilter === "all" || m.competition === _compFilter));

        const upcoming = [..._matches]
            .sort((a, b) => a.id - b.id)
            .find(m => !m.result && (_compFilter === "all" || m.competition === _compFilter)) ?? null;

        // reset selection to first visible
        if (!completed.find(m => m.id === selectedMatchId)) {
            selectedMatchId = completed[0]?.id ?? null;
        }

        const upcomingEl = document.querySelector(".upcoming-card-wrap");
        if (upcomingEl) upcomingEl.innerHTML = upcoming ? createUpcomingFixture(upcoming) : "";

        document.querySelector(".match-list").innerHTML =
            completed.map(m => createMatchCard(m, m.id === selectedMatchId)).join("");

        const match = _matches.find(m => m.id === selectedMatchId) ?? null;
        detailEl.innerHTML = createMatchDetails(match, _players);
        setupTabs(detailEl);
    });

    const list = document.querySelector(".match-list");
    if (!list) return;

    list.addEventListener("click", e => {
        const card = e.target.closest(".match-card");
        if (!card) return;

        const id = Number(card.dataset.matchId);
        if (id === selectedMatchId) return;

        selectedMatchId = id;

        list.querySelectorAll(".match-card").forEach(c => {
            c.classList.toggle("active", Number(c.dataset.matchId) === id);
        });

        const match = _matches.find(m => m.id === id) ?? null;
        detailEl.innerHTML = createMatchDetails(match, _players);
        setupTabs(detailEl);
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
    const cls = getResultClass(match.result);
    const cc  = getCompetitionColor(match.competition);
    return `
    <div class="match-card ${cls}${isActive ? " active" : ""}" data-match-id="${match.id}">
        <span class="mc-comp-dot" style="background:${cc.text}" title="${getCompetitionLabel(match.competition)}"></span>
        <span class="mc-badge mc-badge--${cls}">${match.result}</span>
        <span class="mc-score">${match.scoreFor}–${match.scoreAgainst}</span>
        <span class="mc-opp">${shortOpp(match.opponent)}</span>
    </div>`;
}


function getResultClass(result) {
    return { W: "win", D: "draw", L: "loss" }[result] ?? "";
}
