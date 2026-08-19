// ==========================================
// CareerOS — Player Card Component
// ==========================================

import { getClubLogo } from "../utils/clubLogos.js";

const ROLE_CLASS = {
    "Crucial":   "crucial",
    "Important": "important",
    "Rotation":  "rotation",
    "Prospect":  "prospect",
};

export function createPlayerCard(player) {
    const roleClass = ROLE_CLASS[player.role] ?? "rotation";
    const renderSrc = player.photo || `assets/renders/${player.id}.png`;
    const loanBanner = player.loan
        ? `<div class="sq-loan-bar">🔁 On Loan · ${player.loanClub ?? "Unknown Club"}</div>`
        : "";

    return `
    <div class="sq-card${player.loan ? " sq-card--loan" : player.loanedFrom ? " sq-card--loaned-from" : ""}" data-player-id="${player.id}">
        <div class="sq-card-render">
            <img src="${renderSrc}" alt="${player.name}"
                 onerror="this.style.display='none'">
        </div>
        <div class="sq-card-body">
            <div class="sq-card-name">${player.name}</div>
            <div class="sq-card-meta">
                <span class="sq-pos-badge">${player.position}</span>
                ${player.loan
                    ? (() => {
                        const logo = player.loanClub ? getClubLogo(player.loanClub) : null;
                        return `<span class="sq-loan-badge">
                            ${logo ? `<img src="${logo}" class="sq-loan-logo" alt="${player.loanClub}">` : "🔁"}
                            ${player.loanClub ?? "On Loan"}
                        </span>`;
                      })()
                    : player.loanedFrom
                        ? (() => {
                            const logo = getClubLogo(player.loanedFrom);
                            return `<span class="sq-loaned-from-badge">
                                ${logo ? `<img src="${logo}" class="sq-loan-logo" alt="${player.loanedFrom}">` : "⬇️"}
                                From ${player.loanedFrom}
                            </span>`;
                          })()
                        : `<span class="sq-nationality">${player.nationality}</span>`}
            </div>
        </div>
        <div class="sq-card-right">
            <div class="sq-ovr">${player.overall}</div>
            <div class="sq-role sq-role--${roleClass}">${player.role}</div>
        </div>
        <span class="sq-arrow">›</span>
    </div>`;
}

export function createPositionGroup(label, players) {
    return `
    <div class="sq-group">
        <div class="sq-group-header">
            <span class="sq-group-label">${label}</span>
            <span class="sq-group-count">${players.length}</span>
        </div>
        ${players.map(p => createPlayerCard(p)).join("")}
    </div>`;
}
