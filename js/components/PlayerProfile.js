// ==========================================
// Career Hub
// Player Profile Component
// ==========================================

export function createPlayerProfile(player, matches = []) {
    const stats = createSeasonStats(player, matches);
    const secondaryPositions = player.secondaryPositions?.length
        ? player.secondaryPositions.join(", ")
        : "None";

    return `

        <section class="player-profile fade">

            <div class="player-profile-header">

                <div class="player-overall">
                    ${player.overall}
                </div>

                <h1>${player.name}</h1>

                <p>
                    #${player.number}
                    &middot;
                    ${player.position}
                </p>

                <p>${player.nationality}</p>

            </div>

            <div class="profile-section">

                <h2>Overview</h2>

                <div class="profile-grid">

                    <div class="profile-item">
                        <span>Age</span>
                        <strong>${player.age}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Overall</span>
                        <strong>${player.overall}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Potential</span>
                        <strong>${player.potential}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Preferred Foot</span>
                        <strong>${player.preferredFoot}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Role</span>
                        <strong>${player.role}</strong>
                    </div>

                </div>

            </div>

            <div class="profile-section">

                <h2>Season Statistics</h2>

                <div class="profile-grid">

                    <div class="profile-item">
                        <span>Starts</span>
                        <strong>${stats.starts}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Sub Apps</span>
                        <strong>${stats.subApps}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Goals</span>
                        <strong>${stats.goals}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Assists</span>
                        <strong>${stats.assists}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Minutes</span>
                        <strong>${stats.minutes}</strong>
                    </div>

                    <div class="profile-item">
                        <span>Average Rating</span>
                        <strong>${stats.averageRating}</strong>
                    </div>

                </div>

            </div>

            <div class="profile-section">

                <h2>Recent Form</h2>

                <div class="form-list">
                    ${stats.recentForm.map(rating => `
                        <span class="form-rating ${rating >= 8 ? "excellent" : rating >= 7 ? "good" : "average"}">${rating.toFixed(1)}</span>
                    `).join("")}
                </div>

            </div>

            <div class="profile-section">

                <h2>Season Breakdown</h2>

                <div class="competition-list">
                    <div class="competition-row">
                        <strong>La Liga</strong>
                        <span>${stats.leagueStarts + stats.leagueSubApps} apps &middot; ${stats.leagueGoals} goals &middot; ${stats.leagueAssists} assists &middot; ${stats.leagueAverageRating}</span>
                    </div>
                    <div class="competition-row">
                        <strong>Champions League</strong>
                        <span>${stats.championsApps} apps &middot; ${stats.championsGoals} goals &middot; ${stats.championsAssists} assists &middot; ${stats.championsAverageRating}</span>
                    </div>
                </div>

            </div>

            <div class="profile-section">

                <h2>Career Information</h2>

                <div class="profile-grid">
                    <div class="profile-item"><span>Nationality</span><strong>${player.nationality}</strong></div>
                    <div class="profile-item"><span>Primary Position</span><strong>${player.position}</strong></div>
                    <div class="profile-item"><span>Secondary Positions</span><strong>${secondaryPositions}</strong></div>
                    <div class="profile-item"><span>Captaincy</span><strong>${player.captain ? "Captain" : player.viceCaptain ? "Vice Captain" : "No"}</strong></div>
                    <div class="profile-item"><span>Contract</span><strong>2032</strong></div>
                    <div class="profile-item"><span>Status</span><strong>Available</strong></div>
                </div>

            </div>

        </section>

    `;
}

function createSeasonStats(player, matches) {
    const playerKeys = getPlayerKeys(player);
    let starts = 0;
    let subApps = 0;
    let goals = 0;
    let assists = 0;
    const ratings = [];
    const minutes = [];

    for (const match of matches) {
        const performance = match.performances?.find(entry =>
            playerKeys.some(key => namesMatch(key, normalizeName(entry.player)))
        );

        const subEvent = match.substitutions?.find(event =>
            (event.on ?? []).some(name =>
                playerKeys.some(key => namesMatch(key, normalizeName(name)))
            )
        );

        const offEvent = match.substitutions?.find(event =>
            (event.off ?? []).some(name =>
                playerKeys.some(key => namesMatch(key, normalizeName(name)))
            )
        );

        if (performance) {
            ratings.push(Number(performance.rating));
        }

        if (subEvent) {
            subApps += 1;
            minutes.push(Math.max(90 - Number(subEvent.minute || 0), 0));
        } else if (offEvent) {
            starts += 1;
            minutes.push(Math.max(Number(offEvent.minute || 0), 0));
        } else if (performance) {
            starts += 1;
            minutes.push(90);
        }

        for (const goal of match.goals ?? []) {
            if (playerKeys.some(key => namesMatch(key, normalizeName(goal.player)))) {
                goals += 1;
            }
        }

        for (const assist of match.assists ?? []) {
            if (playerKeys.some(key => namesMatch(key, normalizeName(assist.player)))) {
                assists += assist.count ?? 1;
            }
        }
    }

    const totalApps = starts + subApps;
    const averageRating = ratings.length
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
        : player.overall >= 90 ? "7.8" : "7.0";
    const recentForm = ratings.slice(-5).reverse();

    return {
        starts,
        subApps,
        goals,
        assists,
        minutes: minutes.reduce((sum, value) => sum + value, 0),
        averageRating,
        recentForm: recentForm.length ? recentForm : [Number(averageRating)],
        leagueApps: totalApps,
        leagueGoals: goals,
        leagueAssists: assists,
        leagueAverageRating: averageRating,
        leagueStarts: starts,
        leagueSubApps: subApps,
        championsApps: 0,
        championsGoals: 0,
        championsAssists: 0,
        championsAverageRating: "-"
    };
}

function normalizeName(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function namesMatch(a, b) {
    return a === b || a.includes(b) || b.includes(a);
}

function getPlayerKeys(player) {
    const keys = new Set([normalizeName(player.name)]);
    const normalized = normalizeName(player.name);

    const nicknameMap = {
        "thibaut courtois": ["courtois"],
        "marc cucurella": ["cucurella"],
        "alessandro bastoni": ["bastoni"],
        "nico schlotterbeck": ["schlotterbeck"],
        "trent alexander arnold": ["trent", "trent alexander arnold"],
        "rodri": ["rodri"],
        "federico valverde": ["valverde"],
        "jude bellingham": ["bellingham"],
        "vinicius junior": ["vinicius", "vinicius jr", "vini jr", "vini"],
        "kylian mbappe": ["mbappe", "mbappe"],
        "eduardo camavinga": ["camavinga"],
        "guler": ["guler", "arda guler"],
        "olise": ["olise"],
        "diomande": ["diomande"],
        "militao": ["militao", "eder militao"],
        "andriy lunin": ["lunin"],
        "dumfries": ["dumfries"],
        "jose mourinho": ["mourinho"]
    };

    for (const alias of nicknameMap[normalized] ?? []) {
        keys.add(normalizeName(alias));
    }

    return [...keys];
}
