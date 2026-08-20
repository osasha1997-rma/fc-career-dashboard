// ==========================================
// Career Hub UI Utilities
// ==========================================

export function setHeader(title, subtitle = "", actionHtml = "") {
    const main = document.getElementById("header-main");
    if (!main) return;
    main.innerHTML = `
        <div class="header-content">
            ${actionHtml ? `<div class="header-action">${actionHtml}</div>` : ""}
            <h2>${title}</h2>
            ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
    `;
}

export function renderScreen(html, init) {
    const container = document.getElementById("screen-container");

    container.innerHTML = html;

    if (init) init();

    container.classList.add("fade");

    setTimeout(() => {
        container.classList.remove("fade");
    }, 250);
}

export function showLoader(msg = "Loading…") {
    const el = document.getElementById("global-loader");
    if (el) { document.getElementById("gl-msg").textContent = msg; el.style.display = "flex"; }
}

export function hideLoader() {
    const el = document.getElementById("global-loader");
    if (el) el.style.display = "none";
}

let _toastTimer;
export function showToast(msg, type = "success") {
    const el = document.getElementById("global-toast");
    if (!el) return;
    clearTimeout(_toastTimer);
    el.textContent = msg;
    el.className = `g-toast${type === "error" ? " g-toast--error" : ""}`;
    _toastTimer = setTimeout(() => { el.classList.add("g-toast--hidden"); }, 2500);
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
