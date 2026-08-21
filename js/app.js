// ==========================================
// Career Hub
// Main Application
// Version 0.2.0 Beta
// ==========================================

import { loadAll, fetchCareers, activateCareer, createCareer, addPlayer, updatePlayer, deletePlayer } from "./api.js";

import {
    setHeader,
    renderScreen,
    hideLoadingScreen,
    setActiveNavigation,
    showLoader,
    hideLoader,
    showToast
} from "./ui.js";

import { registerRoute, getRoute } from "./router.js";

import { renderDashboard } from "./dashboard.js";
import { renderDashboardGlass } from "./dashboardGlass.js";
import {
    renderSquad,
    initializeSquad
} from "./squad.js";
import { renderAnalytics, initializeAnalytics } from "./analytics.js";
import { renderTransfers, initializeTransfers } from "./transfers.js";
import { createCompetitions, initializeCompetitions } from "./competitions.js";
import { renderDevelopment } from "./development.js";
import { createCalendar, initializeCalendar } from "./calendar.js";
import { createPlayerProfile } from "./components/PlayerProfile.js";
import { renderSquadReport } from "./squadReport.js";
import { renderAIAssistant, initializeAIAssistant } from "./aiAssistant.js";
import { createMatchCentre,
    initializeMatchCentre,
    setSelectedMatch
 } from "./match-center.js";
import { deriveSeasonStats } from "./utils/stats.js";
import { initPlayers } from "./utils/players.js";
 
let _photoBase64 = null;

const _uploadApiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000/api"
    : "https://fc-career-dashboard.onrender.com/api";

async function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const res = await fetch(`${_uploadApiBase}/upload/photo`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dataUri: ev.target.result }),
                });
                const data = await res.json();
                if (!res.ok) reject(new Error(data.error ?? "Upload failed"));
                else resolve(data.url);
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

const state = {
    season: null,
    players: [],
    matches: [],
    standings: {},
    leagueStats: {},
    scoutReport: null,
    academy: [],
    transfers: { ins: [], outs: [], loans: [] },
    selectedPlayer: null,
    careerId: null,
};

registerRoute("dashboard", () => {
    const stats = deriveSeasonStats(state.matches, state.players);
    const played = state.matches.filter(m => m.result);
    const upcoming = state.matches.find(m => !m.result);
    const lastMatch = played.at(-1) ?? null;
    const season = {
        ...state.season,
        lastFixture: lastMatch ? {
            competition: lastMatch.competition,
            opponent:    lastMatch.opponent,
            venue:       lastMatch.venue,
            result:      lastMatch.result,
            score:       `${lastMatch.scoreFor}-${lastMatch.scoreAgainst}`
        } : state.season.lastFixture,
        nextFixture: upcoming ? {
            competition: upcoming.competition,
            opponent:    upcoming.opponent,
            venue:       upcoming.venue,
            date:        upcoming.date
        } : null
    };
    const theme = document.documentElement.getAttribute("data-theme") || "classic";
    setHeader("Dashboard", state.season.club);
    if (theme === "liquid-glass") {
        return {
            html: renderDashboardGlass(season, stats, state.matches, state.players),
            init: () => {
                document.querySelectorAll(".gdb-view-all[data-screen]").forEach(btn => {
                    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
                });
            }
        };
    }
    return {
        html: renderDashboard(season, stats, state.matches, state.players),
        init: () => {
            // Show first upcoming card by default, then handle filter
            const showUpcoming = comp => {
                document.querySelectorAll(".db-upcoming").forEach(el => {
                    el.style.display = (comp === "all" || el.dataset.comp === comp) ? "" : "none";
                });
            };
            showUpcoming("all");

            document.querySelector(".db-fixture-filter")?.addEventListener("click", e => {
                const btn = e.target.closest(".db-fix-btn");
                if (!btn) return;
                document.querySelectorAll(".db-fix-btn").forEach(b => b.classList.toggle("active", b === btn));
                showUpcoming(btn.dataset.comp);
            });
        }
    };
});

registerRoute("squad", () => {
    setHeader(
        "Squad",
        `${state.players.length} Players`,
        state.careerId
            ? `<button class="btn-add-player" id="btn-add-player">＋ Add Player</button>`
            : ""
    );
    return {
        html: renderSquad(state.players, state.season, state.matches),
        init: () => {
            initializeSquad(openPlayerProfile);
            document.getElementById("btn-add-player")?.addEventListener("click", openAddPlayerModal);
        }
    };
});

registerRoute("player-profile", () => {
    if (!state.selectedPlayer) {
        return getRoute("squad")();
    }

    setHeader(
        state.selectedPlayer.name,
        `${state.selectedPlayer.position} · #${state.selectedPlayer.number}`,
        `<button id="back-to-squad" class="back-btn">← Back</button>`
    );

    const canEdit = !!state.careerId;

    return {
        html: createPlayerProfile(state.selectedPlayer, state.matches, canEdit),
        init: () => {
            document.getElementById("back-to-squad")?.addEventListener("click", () => {
                showScreen("squad");
            });

            if (!canEdit) return;

            document.getElementById("pp-edit-btn")?.addEventListener("click", () => {
                openEditPlayerModal(state.selectedPlayer);
            });

            document.getElementById("pp-delete-btn")?.addEventListener("click", () => {
                document.getElementById("pp-delete-confirm").style.display = "flex";
                document.getElementById("pp-delete-btn").style.display = "none";
            });

            document.getElementById("pp-delete-confirm-no")?.addEventListener("click", () => {
                document.getElementById("pp-delete-confirm").style.display = "none";
                document.getElementById("pp-delete-btn").style.display = "";
            });

            document.getElementById("pp-delete-confirm-yes")?.addEventListener("click", async () => {
                const btn = document.getElementById("pp-delete-confirm-yes");
                btn.textContent = "Deleting…";
                btn.disabled = true;
                try {
                    await deletePlayer(state.careerId, state.selectedPlayer.id);
                    state.players = state.players.filter(p => p.id !== state.selectedPlayer.id);
                    state.selectedPlayer = null;
                    showScreen("squad");
                } catch (err) {
                    btn.textContent = "Yes, Delete";
                    btn.disabled = false;
                    document.getElementById("pp-delete-confirm").style.display = "none";
                    document.getElementById("pp-delete-btn").style.display = "";
                }
            });
        }
    };
});

registerRoute("matches", () => {
    setHeader(
        "Match Centre",
        `${state.matches.filter(m => m.result).length} Matches`,
        `<button class="btn-add-player" id="btn-add-match">＋ Add Match</button>`
    );

    return {
        html: createMatchCentre(state.matches, state.players),
        init: () => {
            initializeMatchCentre();
            document.getElementById("btn-add-match")?.addEventListener("click", openAddMatchModal);
        }
    };
});

registerRoute("competitions", () => {
    setHeader("Competitions", "2027/28");
    return {
        html: createCompetitions(state.matches, state.standings, state.leagueStats, state.season.club),
        init: initializeCompetitions
    };
});

registerRoute("calendar", () => {
    setHeader("Season Calendar", "2027/28");
    return {
        html: createCalendar(state.matches),
        init: () => initializeCalendar(id => { setSelectedMatch(id); showScreen("matches"); })
    };
});

registerRoute("analytics", () => {
    setHeader("Analytics", "2027/28");
    return {
        html: renderAnalytics(state.matches, state.players),
        init: initializeAnalytics
    };
});

registerRoute("transfers", () => {
    setHeader("Transfer Hub", "FC 26 Database");
    return {
        html: renderTransfers(state.players, state.matches, state.season),
        init: () => initializeTransfers(state.scoutReport, state.transfers, state.careerId)
    };
});

registerRoute("ai-assistant", () => {
    setHeader("AI Assistant", "2027/28");
    const html = renderAIAssistant(state.players, state.matches, state.scoutReport, state.season);
    return { html, init: () => initializeAIAssistant(state.players, state.matches, state.scoutReport, state.season) };
});

registerRoute("squad-report", () => {
    setHeader("Squad Report", state.season?.season ?? "");
    return { html: renderSquadReport(state.players, state.matches, state.season ?? {}) };
});

registerRoute("development", () => {
    setHeader("Development", "2027/28");
    return { html: renderDevelopment(state.players, state.academy) };
});

async function showScreen(name) {
    const screen = getRoute(name);

    if (!screen) {
        console.error("Screen not found:", name);
        return;
    }

    const result = await screen();
    const html = typeof result === "string" ? result : result.html;
    const init = typeof result === "object" ? result.init : null;

    renderScreen(html, init);
    setActiveNavigation(name === "player-profile" ? "squad" : name);
}

function openPlayerProfile(playerId) {
    state.selectedPlayer = state.players.find(player => player.id === Number(playerId));

    if (state.selectedPlayer) {
        showScreen("player-profile");
    }
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.addEventListener("click", () => {
            showScreen(button.dataset.screen);
        });
    });
}

// ── Theme system ──────────────────────────────────────────────

const THEMES = ["classic", "liquid-glass", "material3", "fluent", "fc"];

function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = "classic";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("careeros-theme", theme);
    const select = document.getElementById("theme-select");
    if (select) select.value = theme;
    const active = document.querySelector(".nav-btn.active");
    if (active && state.season) showScreen(active.dataset.screen);
}

function setupThemeSwitcher() {
    const saved = localStorage.getItem("careeros-theme") || "classic";
    applyTheme(saved);
    // Theme select is now inside settings panel; listener attached in setupSettings
}

// ── Settings panel ────────────────────────────────────────────

function populateSettingsPlayers() {
    const players = state.players ?? [];
    ["settings-captain","settings-vice"].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = `<option value="">None</option>` +
            players.map(p => `<option value="${p.name}" ${p.name === current ? "selected" : ""}>${p.name} (${p.position})</option>`).join("");
    });
}

function openSettings() {
    // Populate player dropdowns
    populateSettingsPlayers();

    // Reflect current season values
    const s = state.season ?? {};
    const sel = v => id => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
    sel(s.formation)("settings-formation");
    sel(s.difficulty ?? "Professional")("settings-difficulty");
    sel(s.captain)("settings-captain");
    sel(s.viceCaptain)("settings-vice");
    const budget = document.getElementById("settings-budget");
    if (budget) budget.value = s.transferBudget ?? "";
    const win = document.getElementById("settings-window");
    if (win) {
        win.checked = !!s.transferWindowOpen;
        document.getElementById("settings-window-label").textContent = win.checked ? "Open" : "Closed";
    }

    document.getElementById("settings-overlay").style.display = "block";
    document.getElementById("settings-panel").classList.add("settings-panel--open");
}

function closeSettings() {
    document.getElementById("settings-overlay").style.display = "none";
    document.getElementById("settings-panel").classList.remove("settings-panel--open");
}

async function setupSettings() {
    document.getElementById("settings-nav-btn").addEventListener("click", openSettings);
    document.getElementById("settings-close").addEventListener("click", closeSettings);
    document.getElementById("settings-overlay").addEventListener("click", closeSettings);

    // Theme select inside settings
    document.getElementById("theme-select")?.addEventListener("change", e => applyTheme(e.target.value));

    // Transfer window toggle label
    document.getElementById("settings-window")?.addEventListener("change", e => {
        document.getElementById("settings-window-label").textContent = e.target.checked ? "Open" : "Closed";
    });

    // Save
    document.getElementById("settings-save").addEventListener("click", async () => {
        const formation       = document.getElementById("settings-formation").value;
        const difficulty      = document.getElementById("settings-difficulty").value;
        const captain         = document.getElementById("settings-captain").value;
        const viceCaptain     = document.getElementById("settings-vice").value;
        const transferBudget  = parseFloat(document.getElementById("settings-budget").value) || 0;
        const transferWindowOpen = document.getElementById("settings-window").checked;

        // Update local state
        state.season = { ...state.season, formation, difficulty, captain, viceCaptain, transferBudget, transferWindowOpen };

        // Update captain flags on players
        state.players.forEach(p => {
            p.captain     = p.name === captain;
            p.viceCaptain = p.name === viceCaptain;
        });

        // Persist to MongoDB if connected
        if (state.careerId) {
            try {
                const _settingsApiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000/api"
    : "https://fc-career-dashboard.onrender.com/api";
                await fetch(`${_settingsApiBase}/careers/${state.careerId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ season: state.season, players: state.players }),
                });
            } catch { /* offline — changes saved in memory only */ }
        }

        closeSettings();
        // Re-render current screen to reflect formation change
        const active = document.querySelector(".nav-btn.active");
        if (active && state.season) showScreen(active.dataset.screen);
    });
}

async function loadApplicationData() {
    const data = await loadAll();
    if (!data.season || !data.players || !data.matches) {
        throw new Error("Failed to load required data");
    }
    state.season      = data.season;
    state.players     = data.players;
    state.matches     = data.matches;
    state.standings   = data.standings   ?? {};
    state.leagueStats = data.leagueStats ?? {};
    state.scoutReport = data.scoutReport ?? null;
    state.academy     = data.academy     ?? [];
    state.transfers   = data.transfers   ?? { ins: [], outs: [], loans: [] };
    state.careerId    = data.careerId    ?? null;
    initPlayers(data.players);
}

// ── Career widget ─────────────────────────────────────────────

const CAREERS_KEY = "careeros-careers";

function getCareers() {
    try { return JSON.parse(localStorage.getItem(CAREERS_KEY)) || []; }
    catch { return []; }
}

function saveCareers(careers) {
    localStorage.setItem(CAREERS_KEY, JSON.stringify(careers));
}

function seedCareers(season) {
    const careers = getCareers();
    const alreadySeeded = careers.some(c => c.club === season.club && c.manager === season.manager);
    if (!alreadySeeded) {
        careers.unshift({ id: "default", club: season.club, manager: season.manager, season: season.season, active: true });
        saveCareers(careers);
    }
}

async function renderCareerWidget(season) {
    const logoPath = "assets/icons/logo.png";

    // Try backend first, fall back to localStorage
    let careers = await fetchCareers();
    if (!careers.length) careers = getCareers();

    const optionItems = careers.map(c => {
        const club    = c.club    ?? c["season.club"]    ?? c.season?.club    ?? c.name ?? "Unknown";
        const manager = c.manager ?? c["season.manager"] ?? c.season?.manager ?? "";
        const season  = c.season  ?? c["season.season"]  ?? "";
        const isActive = c.active;
        const id = c._id ?? c.id;
        return `
        <div class="cw-option ${isActive ? "cw-option--active" : ""}" data-career-id="${id}">
            <div style="display:flex;flex-direction:column;gap:2px;flex:1;min-width:0">
                <span class="cw-option-club">${club}</span>
                <span class="cw-option-meta">${manager}${manager && season ? " · " : ""}${typeof season === "string" ? season : season?.season ?? ""}</span>
            </div>
            ${isActive ? `<span class="cw-option-check">✓</span>` : ""}
        </div>`;
    }).join("");

    const widget = document.getElementById("career-widget");
    if (!widget) return;

    widget.innerHTML = `
        <div class="cw-trigger" id="cw-trigger">
            <img src="${logoPath}" class="cw-logo" alt="${season.club}" onerror="this.style.display='none'">
            <div class="cw-text">
                <span class="cw-club">${season.club}</span>
                <span class="cw-meta">${season.manager} · ${season.season}</span>
            </div>
            <svg class="cw-chevron" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="cw-dropdown" id="cw-dropdown">
            ${optionItems}
            <div class="cw-divider"></div>
            <div class="cw-option cw-option--add" id="cw-add-btn">
                <span class="cw-add-icon">＋</span>
                <span class="cw-option-club">Add new career</span>
            </div>
        </div>
    `;

    document.getElementById("cw-trigger").addEventListener("click", e => {
        e.stopPropagation();
        document.getElementById("cw-dropdown").classList.toggle("cw-dropdown--open");
    });

    document.addEventListener("click", () => {
        document.getElementById("cw-dropdown")?.classList.remove("cw-dropdown--open");
    }, { once: false });

    // Switch career
    widget.querySelectorAll(".cw-option[data-career-id]").forEach(el => {
        el.addEventListener("click", async e => {
            e.stopPropagation();
            const id = el.dataset.careerId;
            if (el.classList.contains("cw-option--active")) return;
            document.getElementById("cw-dropdown").classList.remove("cw-dropdown--open");
            try {
                showLoader("Switching career…");
                const data = await activateCareer(id);
                state.season      = data.season;
                state.players     = data.players;
                state.matches     = data.matches;
                state.standings   = data.standings   ?? {};
                state.leagueStats = data.leagueStats ?? {};
                state.scoutReport = data.scoutReport ?? null;
                state.academy     = data.academy     ?? [];
                state.transfers   = data.transfers   ?? { ins: [], outs: [], loans: [] };
                state.careerId    = data.careerId;
                await renderCareerWidget(state.season);
                hideLoader();
                showToast(`Switched to ${data.season?.club ?? "career"} ${data.season?.season ?? ""}`);
                showScreen("dashboard");
            } catch {
                hideLoader();
                showToast("Could not switch career — is the server running?", "error");
            }
        });
    });

    document.getElementById("cw-add-btn").addEventListener("click", e => {
        e.stopPropagation();
        document.getElementById("cw-dropdown").classList.remove("cw-dropdown--open");
        document.getElementById("new-career-modal").style.display = "flex";
        document.getElementById("nc-club").focus();
    });
}

function setupCareerModal() {
    document.getElementById("nc-cancel").addEventListener("click", () => {
        document.getElementById("new-career-modal").style.display = "none";
    });
    document.getElementById("new-career-modal").addEventListener("click", e => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = "none";
    });
    document.getElementById("nc-save").addEventListener("click", async () => {
        const club        = document.getElementById("nc-club").value.trim();
        const manager     = document.getElementById("nc-manager").value.trim();
        const seasonInput = document.getElementById("nc-season").value.trim();
        const competition = document.getElementById("nc-competition")?.value.trim() ?? "";
        if (!club || !manager) return;

        const payload = {
            name:   `${club} ${seasonInput || "—"}`,
            season: { club, manager, season: seasonInput || "—", competition, formation: "4-3-3", teamMorale: "High", trainingLevel: "Good" },
            players: [], matches: [], active: false,
        };

        try {
            await createCareer(payload);
        } catch {
            // fall back to localStorage
            const careers = getCareers();
            careers.push({ id: `career-${Date.now()}`, club, manager, season: seasonInput || "—", active: false });
            saveCareers(careers);
        }

        document.getElementById("new-career-modal").style.display = "none";
        ["nc-club","nc-manager","nc-season"].forEach(id => { document.getElementById(id).value = ""; });
        renderCareerWidget(state.season);
    });
}

// ── Add Player Modal ─────────────────────────────────────────

function setupAddPlayerModal() {
    const modal    = document.getElementById("add-player-modal");
    const overall  = document.getElementById("ap-overall");
    const potential = document.getElementById("ap-potential");
    const loanChk  = document.getElementById("ap-loan");

    // Slider live values
    const syncSlider = (el, badge) => {
        badge.textContent = el.value;
        el.addEventListener("input", () => { badge.textContent = el.value; });
    };
    syncSlider(overall,  document.getElementById("ap-overall-val"));
    syncSlider(potential, document.getElementById("ap-potential-val"));

    // Photo upload — uploads to Cloudinary, stores URL
    document.getElementById("ap-photo").addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        const btn = document.getElementById("ap-photo-btn");
        btn.textContent = "Uploading…";
        btn.disabled = true;
        try {
            const url = await uploadToCloudinary(file);
            _photoBase64 = url;
            const preview = document.getElementById("ap-photo-preview");
            preview.innerHTML = `<img src="${url}" alt="preview">`;
            btn.textContent = "📷 Change Photo";
        } catch {
            showToast("Photo upload failed");
            btn.textContent = "📷 Upload Photo";
        } finally {
            btn.disabled = false;
        }
    });
    document.getElementById("ap-photo-btn").addEventListener("click", () => {
        document.getElementById("ap-photo").click();
    });

    // Show/hide loan fields
    loanChk.addEventListener("change", () => {
        document.getElementById("ap-loan-club-field").style.display = loanChk.checked ? "" : "none";
        document.getElementById("ap-loan-dur-field").style.display  = loanChk.checked ? "" : "none";
    });

    // Cancel
    document.getElementById("ap-cancel").addEventListener("click", () => {
        modal.style.display = "none";
    });
    modal.addEventListener("click", e => {
        if (e.target === modal) modal.style.display = "none";
    });

    // Save
    document.getElementById("ap-save").addEventListener("click", async () => {
        const name     = document.getElementById("ap-name").value.trim();
        const position = document.getElementById("ap-position").value;
        if (!name || !position) {
            alert("Name and Position are required.");
            return;
        }

        const secondary = document.getElementById("ap-secondary").value
            .split(",").map(s => s.trim()).filter(Boolean);

        const player = {
            number:             parseInt(document.getElementById("ap-number").value)  || 0,
            name,
            position,
            secondaryPositions: secondary,
            overall:            parseInt(overall.value),
            potential:          parseInt(potential.value),
            age:                parseInt(document.getElementById("ap-age").value)      || 0,
            nationality:        document.getElementById("ap-nationality").value.trim(),
            preferredFoot:      document.getElementById("ap-foot").value,
            captain:            document.getElementById("ap-captain").checked,
            viceCaptain:        document.getElementById("ap-vice").checked,
            role:               document.getElementById("ap-role").value,
            contractEnd:        document.getElementById("ap-contract-end").value || null,
            wage:               parseInt(document.getElementById("ap-wage").value)  || null,
            marketValue:        parseFloat(document.getElementById("ap-value").value) * 1e6 || null,
            loan:               loanChk.checked,
            loanClub:           document.getElementById("ap-loan-club").value.trim() || null,
            loanDurationMonths: parseInt(document.getElementById("ap-loan-dur").value) || 0,
            photo:              _photoBase64 || null,
        };

        const btn = document.getElementById("ap-save");
        btn.disabled = true;

        const editId = modal.dataset.editPlayerId ? parseInt(modal.dataset.editPlayerId) : null;

        showLoader(editId != null ? "Updating player…" : "Adding player…");
        try {
            let saved;
            if (editId != null) {
                saved = await updatePlayer(state.careerId, editId, player);
                const idx = state.players.findIndex(p => p.id === editId);
                if (idx !== -1) state.players[idx] = { ...state.players[idx], ...saved };
                if (state.selectedPlayer?.id === editId) state.selectedPlayer = state.players[idx];
            } else {
                saved = await addPlayer(state.careerId, player);
                state.players.push(saved);
            }
            modal.style.display = "none";
            delete modal.dataset.editPlayerId;
            // Reset form
            ["ap-name","ap-number","ap-age","ap-secondary","ap-wage","ap-value","ap-contract-end","ap-loan-club","ap-loan-dur"]
                .forEach(id => { document.getElementById(id).value = ""; });
            document.getElementById("ap-position").value = "";
            document.getElementById("ap-captain").checked = false;
            document.getElementById("ap-vice").checked    = false;
            document.getElementById("ap-loan").checked    = false;
            document.getElementById("ap-loan-club-field").style.display = "none";
            document.getElementById("ap-loan-dur-field").style.display  = "none";
            overall.value = 75;  document.getElementById("ap-overall-val").textContent  = "75";
            potential.value = 80; document.getElementById("ap-potential-val").textContent = "80";
            _photoBase64 = null;
            document.getElementById("ap-photo").value = "";
            document.getElementById("ap-photo-preview").innerHTML = `<span class="ap-photo-icon">⚽</span>`;
            document.getElementById("ap-photo-btn").textContent = "📷 Upload Photo";
            hideLoader();
            showToast(editId != null ? "Player updated" : "Player added");
            if (editId != null) {
                showScreen("player-profile");
            } else {
                showScreen("squad");
            }
        } catch (err) {
            hideLoader();
            showToast("Could not save player: " + err.message, "error");
        } finally {
            btn.textContent = editId != null ? "Save Changes" : "Add Player";
            btn.disabled = false;
        }
    });
}

// ── Add Match Modal ───────────────────────────────────────────

function playerOptions() {
    return [...state.players]
        .sort((a, b) => b.overall - a.overall)
        .map(p => `<option value="${p.id}">${p.name} (${p.position})</option>`)
        .join("");
}

function addConcededRow(container) {
    const row = document.createElement("div");
    row.className = "am-event-row";
    row.innerHTML = `
        <input type="number" class="am-input am-min" placeholder="Min" min="1" max="120">
        <input type="text" class="am-input am-conceded-name" placeholder="Scorer name (opponent)" style="flex:1;min-width:160px">
        <button type="button" class="am-remove-btn">✕</button>`;
    row.querySelector(".am-remove-btn").onclick = () => row.remove();
    container.appendChild(row);
}

function addGoalRow(container) {
    const row = document.createElement("div");
    row.className = "am-event-row";
    row.innerHTML = `
        <input type="number" class="am-input am-min" placeholder="Min" min="1" max="120">
        <select class="am-input am-player-sel">${playerOptions()}</select>
        <label class="am-own-goal"><input type="checkbox" class="am-og"> OG</label>
        <button type="button" class="am-remove-btn">✕</button>`;
    row.querySelector(".am-remove-btn").onclick = () => row.remove();
    container.appendChild(row);
}

function addAssistRow(container) {
    const row = document.createElement("div");
    row.className = "am-event-row";
    row.innerHTML = `
        <select class="am-input am-player-sel">${playerOptions()}</select>
        <button type="button" class="am-remove-btn">✕</button>`;
    row.querySelector(".am-remove-btn").onclick = () => row.remove();
    container.appendChild(row);
}

function addCardRow(container) {
    const row = document.createElement("div");
    row.className = "am-event-row";
    row.innerHTML = `
        <input type="number" class="am-input am-min" placeholder="Min" min="1" max="120">
        <select class="am-input am-player-sel">${playerOptions()}</select>
        <select class="am-input am-card-type">
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
        </select>
        <button type="button" class="am-remove-btn">✕</button>`;
    row.querySelector(".am-remove-btn").onclick = () => row.remove();
    container.appendChild(row);
}

function addSubRow(container) {
    const row = document.createElement("div");
    row.className = "am-event-row";
    row.innerHTML = `
        <input type="number" class="am-input am-min" placeholder="Min" min="1" max="120">
        <span class="am-sub-label">Off:</span>
        <select class="am-input am-player-sel am-sub-off">${playerOptions()}</select>
        <span class="am-sub-label">On:</span>
        <select class="am-input am-player-sel am-sub-on">${playerOptions()}</select>
        <button type="button" class="am-remove-btn">✕</button>`;
    row.querySelector(".am-remove-btn").onclick = () => row.remove();
    container.appendChild(row);
}

function buildRatingsGrid() {
    const grid = document.getElementById("am-ratings-list");
    if (!grid) return;
    const active = state.players.filter(p => !p.loan).sort((a,b) => b.overall - a.overall);
    grid.innerHTML = active.map(p => `
        <div class="am-rating-row">
            <img src="${p.photo || `assets/renders/${p.id}.png`}" alt="" onerror="this.style.display='none'" class="am-rating-avatar">
            <span class="am-rating-name">${p.name.split(" ").slice(-1)[0]}</span>
            <span class="am-rating-pos">${p.position}</span>
            <input type="number" class="am-input am-rating-val" min="1" max="10" step="0.1" placeholder="—" data-player-id="${p.id}">
        </div>`).join("");
}

function openAddMatchModal() {
    const modal = document.getElementById("add-match-modal");
    // Reset fields
    ["am-date","am-opponent","am-score-for","am-score-against","am-possession","am-shots","am-passes","am-pass-acc","am-tackles","am-matchday","am-opp-possession","am-opp-shots","am-opp-passes","am-opp-pass-acc","am-opp-tackles"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("am-goals-list").innerHTML = "";
    document.getElementById("am-conceded-list").innerHTML = "";
    document.getElementById("am-assists-list").innerHTML = "";
    document.getElementById("am-cards-list").innerHTML = "";
    document.getElementById("am-subs-list").innerHTML = "";
    buildRatingsGrid();

    // Set today's date as default
    document.getElementById("am-date").value = new Date().toISOString().slice(0,10);

    // Populate fixture picker with unplayed matches
    const compLabels = { laliga: "La Liga", ucl: "UEFA Champions League", copa: "Copa del Rey", supercopa: "Supercopa" };
    const upcoming = (state.matches || []).filter(m => !m.result);
    const sel = document.getElementById("am-fixture-sel");
    sel.innerHTML = `<option value="">— Enter manually —</option>` +
        upcoming.map(m => {
            const comp = compLabels[m.competition] || m.competition || "";
            const md = m.matchday ? ` MD${m.matchday}` : m.stage ? ` · ${m.stage}` : "";
            const label = `${m.date ? m.date.slice(0,10) : ""} · ${comp}${md} vs ${m.opponent}`;
            return `<option value="${m.id}">${label}</option>`;
        }).join("");

    // Wire fixture picker auto-fill
    sel.onchange = () => {
        const id = parseInt(sel.value);
        if (!id) return;
        const fix = upcoming.find(m => m.id === id);
        if (!fix) return;
        if (fix.date) document.getElementById("am-date").value = fix.date.slice(0,10);
        if (fix.opponent) document.getElementById("am-opponent").value = fix.opponent;
        if (fix.venue) document.getElementById("am-venue").value = fix.venue;
        if (fix.matchday) document.getElementById("am-matchday").value = fix.matchday;
        if (fix.competition) {
            const compSel = document.getElementById("am-competition");
            if ([...compSel.options].some(o => o.value === fix.competition)) compSel.value = fix.competition;
        }
        if (fix.stage) {
            const stageSel = document.getElementById("am-stage");
            if ([...stageSel.options].some(o => o.value === fix.stage)) stageSel.value = fix.stage;
        }
    };

    // Wire add-row buttons
    document.getElementById("am-add-goal").onclick     = () => addGoalRow(document.getElementById("am-goals-list"));
    document.getElementById("am-add-conceded").onclick = () => addConcededRow(document.getElementById("am-conceded-list"));
    document.getElementById("am-add-assist").onclick   = () => addAssistRow(document.getElementById("am-assists-list"));
    document.getElementById("am-add-card").onclick     = () => addCardRow(document.getElementById("am-cards-list"));
    document.getElementById("am-add-sub").onclick      = () => addSubRow(document.getElementById("am-subs-list"));

    modal.style.display = "flex";
}

async function saveMatch() {
    const scoreFor     = parseInt(document.getElementById("am-score-for").value);
    const scoreAgainst = parseInt(document.getElementById("am-score-against").value);
    const opponent     = document.getElementById("am-opponent").value.trim();
    const date         = document.getElementById("am-date").value;

    if (!opponent || isNaN(scoreFor) || isNaN(scoreAgainst) || !date) {
        alert("Please fill in Date, Opponent and Score.");
        return;
    }

    const result = scoreFor > scoreAgainst ? "W" : scoreFor < scoreAgainst ? "L" : "D";

    // Collect goals
    const goals = [...document.querySelectorAll("#am-goals-list .am-event-row")].map(row => ({
        minute: parseInt(row.querySelector(".am-min").value) || null,
        player: parseInt(row.querySelector(".am-player-sel").value),
        ownGoal: row.querySelector(".am-og").checked || undefined,
    }));

    // Goals conceded (opponent scorers by name)
    const goalsConceded = [...document.querySelectorAll("#am-conceded-list .am-event-row")].map(row => ({
        minute: parseInt(row.querySelector(".am-min").value) || null,
        scorer: row.querySelector(".am-conceded-name").value.trim() || "Unknown",
    }));

    // Collect assists (match to goalscorer count)
    const assists = [];
    document.querySelectorAll("#am-assists-list .am-event-row").forEach(row => {
        const id = parseInt(row.querySelector(".am-player-sel").value);
        const existing = assists.find(a => a.player === id);
        if (existing) existing.count++;
        else assists.push({ player: id, count: 1 });
    });

    // Cards
    const yellowCards = [], redCards = [];
    document.querySelectorAll("#am-cards-list .am-event-row").forEach(row => {
        const entry = { minute: parseInt(row.querySelector(".am-min").value) || null, player: parseInt(row.querySelector(".am-player-sel").value) };
        if (row.querySelector(".am-card-type").value === "yellow") yellowCards.push(entry);
        else redCards.push(entry);
    });

    // Subs
    const substitutions = [...document.querySelectorAll("#am-subs-list .am-event-row")].map(row => ({
        minute:   parseInt(row.querySelector(".am-min").value) || null,
        playerOff: parseInt(row.querySelector(".am-sub-off").value),
        playerOn:  parseInt(row.querySelector(".am-sub-on").value),
    }));

    // Ratings
    const performances = [...document.querySelectorAll(".am-rating-val")]
        .filter(el => el.value)
        .map(el => ({ player: parseInt(el.dataset.playerId), rating: parseFloat(el.value) }));

    // Team stats
    const possession  = parseInt(document.getElementById("am-possession").value) || null;
    const shots       = parseInt(document.getElementById("am-shots").value) || null;
    const passes      = parseInt(document.getElementById("am-passes").value) || null;
    const passAcc     = parseInt(document.getElementById("am-pass-acc").value) || null;
    const tackles     = parseInt(document.getElementById("am-tackles").value) || null;
    const teamStats   = (possession || shots || passes || passAcc || tackles)
        ? { possession, shots, passes, passAccuracy: passAcc, tackles } : {};

    // Opponent stats
    const oppPoss    = parseInt(document.getElementById("am-opp-possession").value) || null;
    const oppShots   = parseInt(document.getElementById("am-opp-shots").value) || null;
    const oppPasses  = parseInt(document.getElementById("am-opp-passes").value) || null;
    const oppPassAcc = parseInt(document.getElementById("am-opp-pass-acc").value) || null;
    const oppTackles = parseInt(document.getElementById("am-opp-tackles").value) || null;
    const opponentStats = (oppPoss || oppShots || oppPasses || oppPassAcc || oppTackles)
        ? { possession: oppPoss, shots: oppShots, passes: oppPasses, passAccuracy: oppPassAcc, tackles: oppTackles } : {};

    const newMatch = {
        id:           Math.max(0, ...state.matches.map(m => m.id)) + 1,
        season:       state.season.season,
        competition:  document.getElementById("am-competition").value,
        stage:        document.getElementById("am-stage").value,
        matchday:     parseInt(document.getElementById("am-matchday").value) || null,
        date,
        venue:        document.getElementById("am-venue").value,
        opponent,
        scoreFor,
        scoreAgainst,
        result,
        startingXI:   [],
        bench:        [],
        goals,
        goalsConceded,
        assists,
        substitutions,
        performances,
        yellowCards,
        redCards,
        injuries:     [],
        teamStats,
        opponentStats,
    };

    const updatedMatches = [...state.matches, newMatch];

    const btn = document.getElementById("am-save");
    btn.disabled = true;

    const _apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:4000/api"
        : "https://fc-career-dashboard.onrender.com/api";

    showLoader("Saving match…");
    try {
        await fetch(`${_apiBase}/careers/${state.careerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matches: updatedMatches }),
        });
        state.matches = updatedMatches;
        document.getElementById("add-match-modal").style.display = "none";
        hideLoader();
        showToast("Match saved");
        showScreen("matches");
    } catch (e) {
        hideLoader();
        showToast("Failed to save match: " + e.message, "error");
    } finally {
        btn.disabled = false;
    }
}

// Wire modal once DOM ready
document.getElementById("am-cancel")?.addEventListener("click", () => {
    document.getElementById("add-match-modal").style.display = "none";
});
document.getElementById("am-save")?.addEventListener("click", saveMatch);
document.getElementById("add-match-modal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("add-match-modal"))
        document.getElementById("add-match-modal").style.display = "none";
});

function openAddPlayerModal() {
    const modal = document.getElementById("add-player-modal");
    delete modal.dataset.editPlayerId;
    document.getElementById("modal-title").textContent = "Add Player";
    document.getElementById("ap-save").textContent = "Add Player";
    modal.style.display = "flex";
    document.getElementById("ap-name").focus();
}

function openEditPlayerModal(player) {
    const modal = document.getElementById("add-player-modal");
    modal.dataset.editPlayerId = player.id;
    document.getElementById("modal-title").textContent = "Edit Player";
    document.getElementById("ap-save").textContent = "Save Changes";

    // Pre-fill fields
    document.getElementById("ap-name").value              = player.name ?? "";
    document.getElementById("ap-number").value            = player.number ?? "";
    document.getElementById("ap-age").value               = player.age ?? "";
    document.getElementById("ap-nationality").value       = player.nationality ?? "";
    document.getElementById("ap-position").value          = player.position ?? "";
    document.getElementById("ap-secondary").value         = (player.secondaryPositions ?? []).join(", ");
    document.getElementById("ap-foot").value              = player.preferredFoot ?? "Right";
    document.getElementById("ap-role").value              = player.role ?? "Rotation";
    document.getElementById("ap-overall").value           = player.overall ?? 75;
    document.getElementById("ap-overall-val").textContent = player.overall ?? 75;
    document.getElementById("ap-potential").value         = player.potential ?? 80;
    document.getElementById("ap-potential-val").textContent = player.potential ?? 80;
    document.getElementById("ap-wage").value               = player.wage ?? "";
    document.getElementById("ap-value").value              = player.marketValue != null ? (player.marketValue / 1e6).toFixed(1) : "";
    document.getElementById("ap-contract-end").value      = player.contractEnd ?? "";
    document.getElementById("ap-captain").checked         = !!player.captain;
    document.getElementById("ap-vice").checked            = !!player.viceCaptain;

    const loanChk = document.getElementById("ap-loan");
    loanChk.checked = !!player.loan;
    document.getElementById("ap-loan-club").value         = player.loanClub ?? "";
    document.getElementById("ap-loan-dur").value          = player.loanDurationMonths ?? 0;
    document.getElementById("ap-loan-club-field").style.display = loanChk.checked ? "" : "none";
    document.getElementById("ap-loan-dur-field").style.display  = loanChk.checked ? "" : "none";

    // Photo
    _photoBase64 = player.photo || null;
    const preview = document.getElementById("ap-photo-preview");
    if (player.photo) {
        preview.innerHTML = `<img src="${player.photo}" alt="preview">`;
        document.getElementById("ap-photo-btn").textContent = "📷 Change Photo";
    } else {
        preview.innerHTML = `<span class="ap-photo-icon">⚽</span>`;
        document.getElementById("ap-photo-btn").textContent = "📷 Upload Photo";
    }

    modal.style.display = "flex";
    document.getElementById("ap-name").focus();
}

function setLoadingMsg(msg) {
    const el = document.getElementById("ls-status");
    if (el) el.textContent = msg;
}

async function startApp() {
    const MAX_RETRIES = 4;
    const RETRY_DELAY = [3000, 6000, 10000, 15000]; // ms between retries

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt === 0) {
                setLoadingMsg("Connecting to server…");
            } else {
                setLoadingMsg(`Server is waking up — retrying (${attempt}/${MAX_RETRIES})…`);
            }

            await loadApplicationData();
            setupNavigation();
            setupThemeSwitcher();
            seedCareers(state.season);
            renderCareerWidget(state.season);
            setupCareerModal();
            setupAddPlayerModal();
            setupSettings();
            hideLoadingScreen();
            showScreen("dashboard");
            return; // success

        } catch (err) {
            console.error(`Attempt ${attempt + 1} failed:`, err.message);

            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY[attempt];
                setLoadingMsg(`Server is waking up — retrying in ${delay / 1000}s… (${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                // All retries exhausted
                document.getElementById("loading-screen").innerHTML = `
                    <div class="loader">
                        <h1>⚽ CareerOS</h1>
                        <p style="color:var(--danger);max-width:320px;text-align:center;line-height:1.6;font-size:.9rem">
                            Could not reach the server after ${MAX_RETRIES} attempts.<br>
                            The server may still be waking up — please try again in a moment.
                        </p>
                        <button onclick="location.reload()" style="margin-top:16px;padding:10px 28px;border-radius:8px;background:#6366f1;color:#fff;border:none;font-weight:700;cursor:pointer;font-size:.9rem">
                            Try Again
                        </button>
                    </div>`;
            }
        }
    }
}

startApp();
