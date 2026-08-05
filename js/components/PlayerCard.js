// ==========================================
// Career Hub
// Player Card Component
// ==========================================

export function createPlayerCard(player) {

    return `
    
        <div class="player-card" data-player-id="${player.id}">

            <div class="player-card-top">

                <span class="player-number">
                    #${player.number}
                </span>

                <span class="player-rating">
                    ${player.overall} OVR
                </span>

            </div>

            <div class="player-card-body">

                <h3>${player.name}</h3>

                <p>
                    ${player.position}
                    •
                    ${player.nationality}
                </p>

            </div>

            <div class="player-card-footer">

                <span class="player-role">
                    ${player.role}
                </span>

                <span class="player-arrow">
                    ›
                </span>

            </div>

        </div>

    `;

}