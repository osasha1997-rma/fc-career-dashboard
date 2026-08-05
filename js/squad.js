// ==========================================
// Career Hub
// Squad Screen
// ==========================================

import { createPlayerCard } from "./components/PlayerCard.js";
import {
    createSearchBar,
    attachSearchListener
} from "./components/SearchBar.js";

import {
    createFilterBar,
    attachFilterListener
} from "./components/FilterBar.js";

// ==========================================
// Squad State
// ==========================================

const squadState = {

    players: [],
    filteredPlayers: [],

    search: "",
    filter: "ALL"

};

// ==========================================
// Render Squad Screen
// ==========================================

export function renderSquad(players = []) {

    squadState.players = players;
    squadState.filteredPlayers = players;

    return `

        <section class="fade">

            <h2 class="screen-title">
                Squad
            </h2>

            ${createFilterBar()}

            ${createSearchBar("Search players...")}

            <div id="player-list">

                ${renderPlayerCards(players)}

            </div>

        </section>

    `;

}

// ==========================================
// Render Player Cards
// ==========================================

function renderPlayerCards(players) {

    if (players.length === 0) {

        return `

            <div class="card">

                <p style="text-align:center;">
                    No players found.
                </p>

            </div>

        `;

    }

    return players
        .map(player => createPlayerCard(player))
        .join("");

}

// ==========================================
// Search
// ==========================================

function searchPlayers(searchText) {

    squadState.search = searchText.toLowerCase();

    updatePlayerList();

}

// ==========================================
// Position Filter
// ==========================================

function filterPlayers(filter) {

    squadState.filter = filter;

    updatePlayerList();

}

// ==========================================
// Update Player List
// ==========================================

function updatePlayerList() {

    let players = [...squadState.players];

    // Position Filter

    if (squadState.filter !== "ALL") {

        players = players.filter(player => {

            switch (squadState.filter) {

                case "GK":
                    return player.position === "GK";

                case "DEF":
                    return [
                        "LB",
                        "CB",
                        "RB",
                        "LWB",
                        "RWB"
                    ].includes(player.position);

                case "MID":
                    return [
                        "CDM",
                        "CM",
                        "CAM",
                        "LM",
                        "RM"
                    ].includes(player.position);

                case "FWD":
                    return [
                        "LW",
                        "RW",
                        "ST",
                        "CF"
                    ].includes(player.position);

                default:
                    return true;

            }

        });

    }

    // Search

    if (squadState.search.length > 0) {

        players = players.filter(player =>

            player.name
                .toLowerCase()
                .includes(squadState.search)

        );

    }

    squadState.filteredPlayers = players;

    document.getElementById("player-list").innerHTML =
        renderPlayerCards(players);

}

// ==========================================
// Initialize Screen
// ==========================================

export function initializeSquad(onPlayerSelect) {

    attachSearchListener(searchPlayers);

    attachFilterListener(filterPlayers);

    document.getElementById("player-list")?.addEventListener("click", event => {

        const card = event.target.closest(".player-card");

        if (card) {
            onPlayerSelect?.(card.dataset.playerId);
        }

    });

}
