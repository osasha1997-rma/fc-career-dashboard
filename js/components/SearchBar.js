// ==========================================
// Career Hub
// Search Bar Component
// ==========================================

export function createSearchBar(placeholder = "Search players...") {

    return `

        <div class="search-container">

            <input
                id="player-search"
                class="search-input"
                type="search"
                placeholder="${placeholder}"
                autocomplete="off"
                spellcheck="false"
            >

        </div>

    `;

}

export function attachSearchListener(callback){

    const input = document.getElementById("player-search");

    if(!input) return;

    input.addEventListener("input",e=>{

        callback(e.target.value);

    });

}