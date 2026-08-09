// ==========================================
// CareerOS — Transfer Hub
// ==========================================

import { loadFC26, buildSquadFC26Map, STAT_META, fmtValue, POSITION_GROUPS } from "./utils/fc26.js";

let _fc26        = null;
let _squadMap    = {};
let _players     = [];
let _matches     = [];
let _season      = {};
let _budget      = 0;
let _scoutReport = null;
let _transferData = null;


// Active filter state
let _filter = {
    pos: "all",
    minOvr: 75,
    maxAge: 30,
    search: "",
    sort: "overall",
    view: "hub",
};

// ── Public API ──────────────────────────────────────────────────────────

export function renderTransfers(players = [], matches = [], season = {}) {
    _players = players;
    _matches = matches;
    _season  = season;
    _budget  = season.transferBudget ?? season.budget ?? 0;

    return `<section class="tr-page fade">
        <div class="page-header">
            <h1>Transfer Hub</h1>
            <p>FC 26 Database · 3,600+ players</p>
        </div>
        <div class="tr-loading" id="tr-loading">
            <div class="tr-spinner"></div>
            <p>Loading FC 26 database…</p>
        </div>
        <div class="tr-content hidden" id="tr-content"></div>
    </section>`;
}

export async function initializeTransfers(scoutReport) {
    _scoutReport = scoutReport ?? null;
    try {
        [_fc26, _transferData] = await Promise.all([
            loadFC26(),
            fetch(`data/transfers.json?v=${Date.now()}`).then(r => r.json()).catch(() => null),
        ]);
        _squadMap = buildSquadFC26Map(_players, _fc26);
        document.getElementById("tr-loading")?.classList.add("hidden");
        const content = document.getElementById("tr-content");
        if (content) {
            content.classList.remove("hidden");
            content.innerHTML = buildUI();
            bindEvents(content);
        }
    } catch (err) {
        document.getElementById("tr-loading").innerHTML =
            `<p style="color:var(--danger)">Failed to load FC 26 data.</p>`;
        console.error(err);
    }
}

// ── UI Builder ──────────────────────────────────────────────────────────

function buildUI() {
    return `
    ${buildViewTabs()}
    <div id="tr-view-body">${buildView()}</div>`;
}

function buildTransferHub() {
    if (!_transferData) return `<div class="th-empty">No transfer data loaded.</div>`;
    const d = _transferData;

    const totalIn  = d.ins.reduce((s, t) => s + t.fee, 0);
    const totalOut = d.outs.reduce((s, t) => s + t.fee, 0);
    const net = totalOut - totalIn;

    const fmt = v => `€${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;

    const playerRow = (p, type) => {
        const isIn = type === "in";
        const club = isIn ? p.from : p.to;
        const arrow = isIn
            ? `<span class="th-arrow th-arrow--in">↓</span>`
            : `<span class="th-arrow th-arrow--out">↑</span>`;
        return `<div class="th-row">
            <div class="th-row-left">
                ${arrow}
                <span class="th-pos">${p.position}</span>
                <div>
                    <div class="th-name">${p.name}</div>
                    <div class="th-club">${isIn ? "From" : "To"}: ${club}</div>
                </div>
            </div>
            <div class="th-fee ${isIn ? "th-fee--in" : "th-fee--out"}">${fmt(p.fee)}</div>
        </div>`;
    };

    const loanRow = p => `<div class="th-row">
        <div class="th-row-left">
            <span class="th-arrow th-arrow--loan">↔</span>
            <span class="th-pos">${p.position}</span>
            <div>
                <div class="th-name">${p.name}</div>
                <div class="th-club">${p.club}${p.direction ? ` · ${p.direction}` : ""}</div>
            </div>
        </div>
        ${p.fee ? `<div class="th-fee">${fmt(p.fee)}</div>` : `<div class="th-loan-badge">Loan</div>`}
    </div>`;

    return `<div class="th-wrap">

        <div class="th-summary">
            <div class="th-sum-item">
                <div class="th-sum-val th-fee--in">+${fmt(totalOut)}</div>
                <div class="th-sum-lbl">Income</div>
            </div>
            <div class="th-sum-divider"></div>
            <div class="th-sum-item">
                <div class="th-sum-val th-fee--out">-${fmt(totalIn)}</div>
                <div class="th-sum-lbl">Spent</div>
            </div>
            <div class="th-sum-divider"></div>
            <div class="th-sum-item">
                <div class="th-sum-val" style="color:${net >= 0 ? "#22c55e" : "#ef4444"}">${net >= 0 ? "+" : ""}${fmt(net)}</div>
                <div class="th-sum-lbl">Net Spend</div>
            </div>
        </div>

        <div class="th-section">
            <div class="th-section-header th-section-header--in">
                <span>⬇ Arrivals</span><span class="th-count">${d.ins.length}</span>
            </div>
            ${d.ins.map(p => playerRow(p, "in")).join("")}
        </div>

        <div class="th-section">
            <div class="th-section-header th-section-header--out">
                <span>⬆ Departures</span><span class="th-count">${d.outs.length}</span>
            </div>
            ${d.outs.map(p => playerRow(p, "out")).join("")}
        </div>

        ${d.loans?.length ? `<div class="th-section">
            <div class="th-section-header th-section-header--loan">
                <span>↔ Loans</span><span class="th-count">${d.loans.length}</span>
            </div>
            ${d.loans.map(p => loanRow(p)).join("")}
        </div>` : ""}

    </div>`;
}

function buildViewTabs() {
    const tabs = [
        { k: "hub",      l: "🔁 Transfer Hub" },
        { k: "scouting", l: "🎯 Scouting" },
        { k: "browse",   l: "🔍 Browse" },
    ];
    return `<div class="tr-view-tabs" id="tr-view-tabs">
        ${tabs.map(t => `<button class="tr-view-tab${t.k === _filter.view ? " active" : ""}" data-view="${t.k}">${t.l}</button>`).join("")}
    </div>`;
}

function buildView() {
    switch (_filter.view) {
        case "hub":      return buildTransferHub();
        case "scouting": return buildScouting();
        case "browse":   return buildBrowse();
        default:         return "";
    }
}

// ── Scouting Arena ───────────────────────────────────────────────────────

function buildScouting() {
    const s = _scoutReport?.scouting_arena;
    if (!s) return `<div class="sc-empty">No scouting data in scout-report.json</div>`;

    // Feasibility dot colour
    const dotCol = d => ({ red:"#ef4444", orange:"#f97316", yellow:"#f59e0b", green:"#22c55e" }[d] ?? "#94a3b8");
    const dot = (d, label) => `<span class="sa-dot" style="background:${dotCol(d)}"></span><span class="sa-feas-label">${label}</span>`;
    const stars = (n, total=5) => `${"★".repeat(n)}${"☆".repeat(total-n)}`;
    const riskCol = r => ({ Low:"#22c55e", Medium:"#f59e0b", High:"#ef4444" }[r] ?? "#94a3b8");

    // ── Shortlist cards ──
    const shortlistHtml = (s.shortlist ?? []).map(p => `
        <div class="sa-card" style="--sa-feas-color:${dotCol(p.feasibility_dot)}">
            <div class="sa-card-header">
                <div class="sa-card-identity">
                    <div class="sa-card-name">${p.name}</div>
                    <div class="sa-card-sub">
                        <span class="sa-pos-badge">${p.position}</span>
                        ${p.club}
                    </div>
                </div>
                <div class="sa-card-vals">
                    <div class="sa-ovr-pot"><span class="sa-ovr">${p.ovr}</span><span class="sa-arrow-sep">→</span><span class="sa-pot">${p.pot}</span></div>
                    <div class="sa-value">${p.value}</div>
                </div>
            </div>
            <div class="sa-card-ratings">
                <div class="sa-rating-row">
                    <span class="sa-rating-label">Footballing Fit</span>
                    <span class="sa-stars">${stars(p.fit_stars)}</span>
                    <span class="sa-fit-label">${p.fit_label}</span>
                </div>
                <div class="sa-rating-row">
                    <span class="sa-rating-label">Transfer Feasibility</span>
                    ${dot(p.feasibility_dot, p.feasibility_label)}
                </div>
            </div>
            <div class="sa-card-desc">${p.description}</div>
            ${p.barrier ? `<div class="sa-barrier">🚫 <strong>Major Barrier:</strong> ${p.barrier}</div>` : ""}
            ${p.verdict ? `<div class="sa-verdict">Scout Verdict: ${p.verdict}</div>` : ""}
        </div>`).join("");

    // ── Watchlist ──
    const watchHtml = (s.watchlist ?? []).map(p => `
        <div class="sa-watch-row">
            <div class="sa-watch-body">
                <div class="sa-watch-name">${p.name}</div>
                <div class="sa-watch-meta"><span class="sa-pos-badge">${p.position}</span> ${p.club}</div>
                <div class="sa-watch-note">${p.note}</div>
                <div class="sa-watch-why">📍 ${p.why}</div>
            </div>
            <div class="sa-watch-right">
                <div class="sa-ovr-pot-sm"><span>${p.ovr}</span><span class="sa-arrow-sep">→</span><span class="sa-pot-sm">${p.pot}</span></div>
                <div class="sa-value-sm">${p.value}</div>
            </div>
        </div>`).join("");

    // ── Wonderkids ──
    const wonderHtml = (s.wonderkids ?? []).map(p => `
        <div class="sa-wonder-card">
            <div class="sa-wonder-header">
                <span class="sa-wonder-flame">🔥</span>
                <span class="sa-wonder-risk sa-wonder-risk--${p.risk.toLowerCase()}">${p.risk} Risk</span>
            </div>
            <div class="sa-wonder-name">${p.name}</div>
            <div class="sa-wonder-meta">${p.position} · ${p.club}</div>
            <div class="sa-wonder-ovr">${p.ovr} <span class="sa-arrow-sep">→</span> <span class="sa-pot">${p.pot}</span></div>
            <div class="sa-wonder-value">${p.value}</div>
            <div class="sa-wonder-stars">${stars(p.pot_stars)}</div>
            <div class="sa-wonder-note">${p.note}</div>
        </div>`).join("");

    // ── Elite Talent ──
    const eliteHtml = (s.elite_talent ?? []).map((p, i) => `
        <div class="sa-elite-row">
            <div class="sa-elite-rank">${String(i + 1).padStart(2, "0")}</div>
            <div class="sa-elite-name">${p.name}</div>
            <div class="sa-elite-pos">${p.position}</div>
            <div class="sa-elite-ovr">${p.ovr} <span class="sa-arrow-sep">→</span> <span class="sa-pot">${p.pot}</span></div>
        </div>`).join("");


    // ── Specialist ──
    const specialistHtml = (s.specialist ?? []).map(group => `
        <div class="sa-spec-group">
            <div class="sa-spec-category">${group.category}</div>
            ${group.players.map(p => `
            <div class="sa-spec-row">
                <div class="sa-spec-left">
                    <span class="sa-spec-name">${p.name}</span>
                    <span class="sa-spec-club">${p.club}</span>
                </div>
                <div class="sa-spec-badge">${p.attr} ${p.val}</div>
                <div class="sa-spec-note">${p.note}</div>
            </div>`).join("")}
        </div>`).join("");

    // ── Avoid ──
    const avoidHtml = (s.avoid ?? []).map(p => {
        const isDnp = p.status === "Do Not Pursue";
        return `<div class="sa-avoid-row ${isDnp ? "sa-avoid-row--dnp" : ""}">
            <div class="sa-avoid-top">
                <div class="sa-avoid-name">${isDnp ? "❌" : "🚫"} ${p.name}</div>
                <span class="sa-avoid-status">${p.status}</span>
            </div>
            <div class="sa-avoid-meta">${p.position} · ${p.club}</div>
            <div class="sa-avoid-reason">${p.reason}</div>
        </div>`;
    }).join("");

    const count = a => `<span class="sc-block-count">${a.length}</span>`;
    return `<div class="sc-page">
        <div class="sa-arena-header">
            <div>
                <div class="sa-arena-title">🏟️ Scouting Arena</div>
                <div class="sa-arena-sub">${_season.club ?? "Club"} · ${_season.season ?? ""}</div>
            </div>
        </div>

        <div class="sc-block sc-block--gold">
            <div class="sc-block-title">🎯 Shortlist ${count(s.shortlist ?? [])}</div>
            <div class="sa-cards">${shortlistHtml}</div>
        </div>

        <div class="sc-block sc-block--blue">
            <div class="sc-block-title">👀 Keep an Eye On ${count(s.watchlist ?? [])}</div>
            <div class="sa-watchlist">${watchHtml}</div>
        </div>

        <div class="sc-block sc-block--purple">
            <div class="sc-block-title">🌱 Wonderkids ${count(s.wonderkids ?? [])}</div>
            <div class="sa-wonder-grid">${wonderHtml}</div>
        </div>

        <div class="sc-block sc-block--white">
            <div class="sc-block-title">💎 Elite Talent ${count(s.elite_talent ?? [])}</div>
            <div class="sa-elite-list">${eliteHtml}</div>
        </div>

        <div class="sc-block sc-block--gold">
            <div class="sc-block-title">⚡ Specialist Watchlist</div>
            <div class="sa-specialist">${specialistHtml}</div>
        </div>

        <div class="sc-block sc-block--red">
            <div class="sc-block-title">🚫 Transfers to Avoid ${count(s.avoid ?? [])}</div>
            <div class="sa-avoid-list">${avoidHtml}</div>
        </div>
    </div>`;
}

// ── Browse ───────────────────────────────────────────────────────────────

function buildBrowse() {
    const filtered = applyFilters();
    return `
    <div class="tr-filters">
        <div class="tr-search-wrap">
            <input class="tr-search" id="tr-search" type="text" placeholder="Search player…" value="${_filter.search}">
        </div>
        <div class="tr-pos-tabs" id="tr-pos-tabs">
            ${["all","GK","DEF","MID","ATT"].map(g =>
                `<button class="tr-pos-tab${_filter.pos === g ? " active" : ""}" data-pos="${g}">${g === "all" ? "All" : g}</button>`
            ).join("")}
        </div>
        <div class="tr-filter-row">
            <label>OVR ≥ <span id="tr-ovr-val">${_filter.minOvr}</span>
                <input type="range" id="tr-ovr" min="60" max="95" value="${_filter.minOvr}" step="1">
            </label>
            <label>Age ≤ <span id="tr-age-val">${_filter.maxAge}</span>
                <input type="range" id="tr-age" min="16" max="38" value="${_filter.maxAge}" step="1">
            </label>
            <select class="tr-sort" id="tr-sort">
                <option value="overall"${_filter.sort==="overall"?" selected":""}>Sort: OVR</option>
                <option value="potential"${_filter.sort==="potential"?" selected":""}>Sort: Potential</option>
                <option value="pace"${_filter.sort==="pace"?" selected":""}>Sort: Pace</option>
                <option value="value_eur"${_filter.sort==="value_eur"?" selected":""}>Sort: Value</option>
                <option value="age"${_filter.sort==="age"?" selected":""}>Sort: Age</option>
            </select>
        </div>
    </div>
    <div class="tr-results-count">${filtered.length} players</div>
    <div class="tr-player-list" id="tr-player-list">
        ${filtered.slice(0, 40).map(p => playerRow(p)).join("")}
        ${filtered.length > 40 ? `<div class="tr-more">Showing top 40 — refine filters to narrow results</div>` : ""}
    </div>`;
}

function applyFilters() {
    let res = _fc26;

    if (_filter.search) {
        const q = _filter.search.toLowerCase();
        res = res.filter(p =>
            p.short_name?.toLowerCase().includes(q) ||
            p.long_name?.toLowerCase().includes(q) ||
            p.nationality_name?.toLowerCase().includes(q) ||
            p.club_name?.toLowerCase().includes(q)
        );
    }

    if (_filter.pos !== "all") {
        const allowed = POSITION_GROUPS[_filter.pos] ?? [];
        res = res.filter(p => {
            const primary = (p.player_positions || "").split(",")[0].trim();
            return allowed.includes(primary);
        });
    }

    res = res.filter(p => (p.overall ?? 0) >= _filter.minOvr && (p.age ?? 99) <= _filter.maxAge);

    const s = _filter.sort;
    res = [...res].sort((a, b) => {
        if (s === "age") return (a.age ?? 99) - (b.age ?? 99);
        return (b[s] ?? 0) - (a[s] ?? 0);
    });

    return res;
}

// ── Squad Ratings ────────────────────────────────────────────────────────

function buildSquadRatings() {
    const rows = _players
        .filter(sp => !sp.loan)
        .map(sp => ({ sp, fc: _squadMap[sp.id] }))
        .sort((a, b) => (b.sp.overall ?? 0) - (a.sp.overall ?? 0));

    return `<div class="tr-squad-grid">
        ${rows.map(({ sp, fc }) => squadRatingCard(sp, fc)).join("")}
    </div>`;
}

function squadRatingCard(sp, fc) {
    // Always use squad player's own OVR — FC26 data provides potential + stat bars only
    const ovr = sp.overall;
    const pot = fc?.potential ?? sp.potential;
    const potDiff = pot - ovr;
    const ovrColor = ovr >= 87 ? "#d4af37" : ovr >= 83 ? "#60a5fa" : "#94a3b8";
    return `<div class="tr-squad-card">
        <div class="tr-squad-ovr" style="color:${ovrColor}">${ovr}</div>
        <div class="tr-squad-name">${sp.name}</div>
        <div class="tr-squad-pos">${sp.position}</div>
        ${potDiff > 0 ? `<div class="tr-squad-pot">↑${pot} pot</div>` : ""}
        ${fc ? `<div class="tr-mini-stats">
            ${STAT_META.map(s => `<div class="tr-mini-stat" title="${s.label}">
                <div class="tr-mini-bar" style="--pct:${fc[s.key] ?? 0}%;--col:${s.color}"></div>
                <div class="tr-mini-val">${fc[s.key] ?? "—"}</div>
            </div>`).join("")}
        </div>` : `<div class="tr-no-fc26">No FC26 data</div>`}
    </div>`;
}

// ── Player cards / rows ──────────────────────────────────────────────────

function playerCard(p) {
    const potDiff = (p.potential ?? p.overall) - p.overall;
    return `<div class="tr-card">
        <div class="tr-card-top">
            <div class="tr-card-ovr">${p.overall}</div>
            <div class="tr-card-pos">${p.player_positions?.split(",")[0] ?? "?"}</div>
        </div>
        <img class="tr-card-face" src="${p.player_face_url ?? ""}" onerror="this.style.display='none'" referrerpolicy="no-referrer">
        <div class="tr-card-name">${p.short_name}</div>
        <div class="tr-card-club">${p.club_name ?? "Free"}</div>
        ${potDiff > 0 ? `<div class="tr-card-pot">🔮 ${p.potential} pot</div>` : ""}
        <div class="tr-card-val">${fmtValue(p.value_eur)}</div>
        <div class="tr-card-stats">
            ${STAT_META.map(s => `<div class="tr-cs" title="${s.label}">
                <span style="color:${s.color}">${s.label}</span>
                <span>${p[s.key] ?? "—"}</span>
            </div>`).join("")}
        </div>
    </div>`;
}

function playerRow(p) {
    return `<div class="tr-row">
        <img class="tr-row-face" src="${p.player_face_url ?? ""}" onerror="this.style.display='none'" referrerpolicy="no-referrer">
        <div class="tr-row-main">
            <div class="tr-row-name">${p.short_name}</div>
            <div class="tr-row-meta">${p.player_positions?.split(",")[0] ?? "?"} · ${p.nationality_name} · ${p.club_name ?? "Free Agent"}</div>
        </div>
        <div class="tr-row-ovr" title="OVR / Potential">${p.overall}${p.potential > p.overall ? `<span class="tr-row-pot">/${p.potential}</span>` : ""}</div>
        <div class="tr-row-stats">
            ${STAT_META.map(s => `<span title="${s.label}" style="color:${s.color}">${p[s.key] ?? "—"}</span>`).join("")}
        </div>
        <div class="tr-row-val">${fmtValue(p.value_eur)}</div>
        <div class="tr-row-age">${p.age}y</div>
    </div>`;
}

// ── Event binding ────────────────────────────────────────────────────────

function bindEvents(root) {
    // View tabs
    root.querySelector("#tr-view-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".tr-view-tab");
        if (!btn) return;
        _filter.view = btn.dataset.view;
        root.querySelectorAll(".tr-view-tab").forEach(b => b.classList.toggle("active", b === btn));
        root.querySelector("#tr-view-body").innerHTML = buildView();
        bindBrowseEvents(root);
    });

    bindBrowseEvents(root);
}

function bindBrowseEvents(root) {
    // Position tabs
    root.querySelector("#tr-pos-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".tr-pos-tab");
        if (!btn) return;
        _filter.pos = btn.dataset.pos;
        root.querySelectorAll(".tr-pos-tab").forEach(b => b.classList.toggle("active", b === btn));
        refreshList(root);
    });

    // Search
    let debounce;
    root.querySelector("#tr-search")?.addEventListener("input", e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            _filter.search = e.target.value.trim();
            refreshList(root);
        }, 200);
    });

    // OVR slider
    root.querySelector("#tr-ovr")?.addEventListener("input", e => {
        _filter.minOvr = +e.target.value;
        root.querySelector("#tr-ovr-val").textContent = _filter.minOvr;
        refreshList(root);
    });

    // Age slider
    root.querySelector("#tr-age")?.addEventListener("input", e => {
        _filter.maxAge = +e.target.value;
        root.querySelector("#tr-age-val").textContent = _filter.maxAge;
        refreshList(root);
    });

    // Sort
    root.querySelector("#tr-sort")?.addEventListener("change", e => {
        _filter.sort = e.target.value;
        refreshList(root);
    });
}

function refreshList(root) {
    const filtered = applyFilters();
    const listEl = root.querySelector("#tr-player-list");
    const countEl = root.querySelector(".tr-results-count");
    if (listEl) listEl.innerHTML = filtered.slice(0, 40).map(p => playerRow(p)).join("")
        + (filtered.length > 40 ? `<div class="tr-more">Showing top 40 — refine filters to narrow results</div>` : "");
    if (countEl) countEl.textContent = `${filtered.length} players`;
}
