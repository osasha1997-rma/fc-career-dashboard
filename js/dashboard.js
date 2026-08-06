// ==========================================
// Career Hub Dashboard
// Version: 0.1.0
// ==========================================

function renderSeasonStats(s) {
    const row = (label, value) => `
        <tr>
            <td>${label}</td>
            <td>${value ?? "—"}</td>
        </tr>`;

    return `
    <div class="card">
        <div class="card-title">Season Statistics</div>
        <table>
            ${row("Matches Played", s.played)}
            ${row("Wins", s.wins)}
            ${row("Draws", s.draws)}
            ${row("Losses", s.losses)}
            ${row("Goals", s.goalsFor)}
            ${row("Goals Conceded", s.goalsAgainst)}
            ${row("Clean Sheets", s.cleanSheets)}
            ${s.avgPossession != null ? row("Avg Possession", `${s.avgPossession}%`) : ""}
            ${s.topScorer   ? row("Top Scorer",   `${s.topScorer.name} (${s.topScorer.goals})`) : ""}
            ${s.topAssists  ? row("Top Assists",  `${s.topAssists.name} (${s.topAssists.assists})`) : ""}
            ${s.topRated    ? row("Highest Rated", `${s.topRated.name} (${s.topRated.rating})`) : ""}
            ${s.avgTeamRating != null ? row("Avg Team Rating", s.avgTeamRating) : ""}
        </table>
    </div>`;
}

function formatCurrency(value) {
    if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(2)}M`;
    }

    if (value >= 1000) {
        return `€${(value / 1000).toFixed(1)}K`;
    }

    return `€${value}`;
}

export function renderDashboard(season, stats) {
    const s = stats;
    return `

        <div class="hero-card">
            <div class="hero-overlay"></div>

            <div class="hero-content">
                <div>
                    <h1>${season.club}</h1>
                    <p>${season.manager}</p>
                    <span>${season.season} • ${season.competition}</span>
                </div>

                <img
                    class="club-logo"
                    src="assets/icons/logo.png"
                    alt="Real Madrid"
                >
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat">
                <div class="stat-value">${s.played}</div>
                <div class="stat-label">Played</div>
            </div>

            <div class="stat">
                <div class="stat-value">${s.wins}</div>
                <div class="stat-label">Wins</div>
            </div>

            <div class="stat">
                <div class="stat-value">${s.draws}</div>
                <div class="stat-label">Draws</div>
            </div>

            <div class="stat">
                <div class="stat-value">${s.losses}</div>
                <div class="stat-label">Losses</div>
            </div>

            <div class="stat">
                <div class="stat-value">${s.cleanSheets}</div>
                <div class="stat-label">Clean Sheets</div>
            </div>
        </div>

        ${renderSeasonStats(s)}

        <div class="card">
            <div class="card-title">
                Season Overview
            </div>

            <table>
                <tr>
                    <td>Formation</td>
                    <td>${season.formation}</td>
                </tr>

                <tr>
                    <td>Transfer Budget</td>
                    <td>${formatCurrency(season.transferBudget)}</td>
                </tr>

                <tr>
                    <td>Captain</td>
                    <td>${season.captain}</td>
                </tr>

                <tr>
                    <td>Vice Captain</td>
                    <td>${season.viceCaptain}</td>
                </tr>
            </table>
        </div>

        <div class="card">
            <div class="card-title">
                Last Match
            </div>

            <div class="fixture-card">
                <div>
                    <strong>${season.lastFixture.competition}</strong>
                    <p>${season.lastFixture.opponent} · ${season.lastFixture.venue}</p>
                </div>

                <div class="fixture-result">
                    ${season.lastFixture.result}
                </div>
            </div>

            <div class="fixture-score">
                ${season.lastFixture.score}
            </div>
        </div>

        ${season.nextFixture ? `
        <div class="card">
            <div class="card-title">Next Match</div>
            <div class="fixture-card">
                <div>
                    <strong>${season.nextFixture.competition}</strong>
                    <p>${season.nextFixture.opponent} · ${season.nextFixture.venue}</p>
                    ${season.nextFixture.date ? `<p>${season.nextFixture.date}</p>` : ""}
                </div>
                <div class="fixture-result pending">Soon</div>
            </div>
        </div>` : ""}

    `;
}
