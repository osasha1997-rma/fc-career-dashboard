// ==========================================
// Career Hub
// Filter Bar Component
// ==========================================

export function createFilterBar(){

    return `

        <div class="filter-bar">

            <button class="filter-btn active" data-filter="ALL">All</button>

            <button class="filter-btn" data-filter="GK">GK</button>

            <button class="filter-btn" data-filter="DEF">DEF</button>

            <button class="filter-btn" data-filter="MID">MID</button>

            <button class="filter-btn" data-filter="FWD">FWD</button>

        </div>

    `;

}

export function attachFilterListener(callback){

    document.querySelectorAll(".filter-btn").forEach(button=>{

        button.addEventListener("click",()=>{

            document.querySelectorAll(".filter-btn").forEach(btn=>{

                btn.classList.remove("active");

            });

            button.classList.add("active");

            callback(button.dataset.filter);

        });

    });

}