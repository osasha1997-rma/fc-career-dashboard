// ==========================================
// Career Hub UI Utilities
// ==========================================

export function setHeader(title, subtitle = "", actionHtml = "") {
    const header = document.getElementById("header");

    header.innerHTML = `
        <div class="header-content">
            ${actionHtml ? `<div class="header-action">${actionHtml}</div>` : ""}
            <h2>${title}</h2>
            ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
    `;
}

export function renderScreen(html) {
    const container = document.getElementById("screen-container");

    container.innerHTML = html;

    container.classList.add("fade");

    setTimeout(() => {
        container.classList.remove("fade");
    }, 250);
}

export function hideLoadingScreen() {
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

export function setActiveNavigation(screen) {

    document.querySelectorAll(".nav-btn").forEach(button => {

        button.classList.remove("active");

        if (button.dataset.screen === screen) {
            button.classList.add("active");
        }

    });

}
