// ==========================================
// Career Hub Dashboard
// Version: 0.1.0
// ==========================================

function formatCurrency(value){

    if(value >= 1000000){

        return `€${(value / 1000000).toFixed(2)}M`;

    }

    if(value >= 1000){

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

            <p>${season.manager}</p>

            <span>${season.season} • ${season.league}</span>

        </div>

        <img
            class="club-logo"
            src="assets/images/real-madrid.png"
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
                    <td>${formatCurrency(season.transferBudget)}
                    </td>
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
                Next Fixture
            </div>

            <h3>${season.nextFixture.competition}</h3>

            <p>

                Real Madrid

                vs

                ${season.nextFixture.opponent}

            </p>

        </div>

        <div class="card">

            <div class="card-title">

                Latest Result

            </div>

            <p>

                ${season.lastFixture.opponent}

            </p>

            <h2>

                ${season.lastFixture.score}

            </h2>

            <p>

                ${season.lastFixture.result}

            </p>

        </div>

    `;

}