// ==========================================
// Career Hub Dashboard
// Version: 0.1.0
// ==========================================

function formatCurrency(value) {
    if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(2)}M`;
    }

    if (value >= 1000) {
        return `€${(value / 1000).toFixed(1)}K`;
    }

    return `€${value}`;
}

export function renderDashboard(season) {
    return `

        <div class="hero-card">
            <div class="hero-overlay"></div>

            <div class="hero-content">
                <div>
                    <h1>${season.club}</h1>
                    <p>José Mourinho</p>
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
                <div class="stat-value">${season.wins}</div>
                <div class="stat-label">Wins</div>
            </div>

            <div class="stat">
                <div class="stat-value">${season.draws}</div>
                <div class="stat-label">Draws</div>
            </div>

            <div class="stat">
                <div class="stat-value">${season.losses}</div>
                <div class="stat-label">Losses</div>
            </div>

            <div class="stat">
                <div class="stat-value">${season.cleanSheets}</div>
                <div class="stat-label">Clean Sheets</div>
            </div>
        </div>

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
                    <td>Goals Scored</td>
                    <td>${season.goalsFor}</td>
                </tr>

                <tr>
                    <td>Goals Conceded</td>
                    <td>${season.goalsAgainst}</td>
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

        <div class="card">
            <div class="card-title">
                Next Match
            </div>

            <div class="fixture-card">
                <div>
                    <strong>${season.nextFixture.competition}</strong>
                    <p>${season.nextFixture.opponent} · ${season.nextFixture.venue}</p>
                </div>

                <div class="fixture-result pending">
                    Soon
                </div>
            </div>
        </div>

    `;
}
