// ==========================================
// CareerOS — Transfer Hub
// ==========================================

let _players      = [];
let _matches      = [];
let _season       = {};
let _budget       = 0;
let _scoutReport  = null;
let _transferData = null;
let _careerId     = null;

let _view = "hub";

// ── Public API ──────────────────────────────────────────────────────────

export function renderTransfers(players = [], matches = [], season = {}) {
    _players = players;
    _matches = matches;
    _season  = season;
    _budget  = season.transferBudget ?? season.budget ?? 0;

    return `<section class="tr-page fade">
        <div class="page-header">
            <h1>Transfer Hub</h1>
            <p>${season.club ?? "Club"} · ${season.season ?? ""}</p>
        </div>
        <div class="tr-content" id="tr-content"></div>
    </section>`;
}

export async function initializeTransfers(scoutReport, transferData = null, careerId = null) {
    _scoutReport  = scoutReport  ?? null;
    _transferData = transferData ?? { ins: [], outs: [], loans: [] };
    _careerId     = careerId;

    const content = document.getElementById("tr-content");
    if (!content) return;
    content.innerHTML = buildUI();
    bindEvents(content);
}

// ── UI Builder ──────────────────────────────────────────────────────────

function buildUI() {
    return `
    ${buildViewTabs()}
    <div id="tr-view-body">${buildView()}</div>`;
}

function buildViewTabs() {
    const tabs = [
        { k: "hub",      l: "🔁 Transfer Hub" },
        { k: "scouting", l: "🎯 Scouting"     },
    ];
    return `<div class="tr-view-tabs" id="tr-view-tabs">
        ${tabs.map(t => `<button class="tr-view-tab${t.k === _view ? " active" : ""}" data-view="${t.k}">${t.l}</button>`).join("")}
    </div>`;
}

function buildView() {
    switch (_view) {
        case "hub":      return buildTransferHub();
        case "scouting": return buildScouting();
        default:         return "";
    }
}

// ── Transfer Hub ─────────────────────────────────────────────────────────

function buildTransferHub() {
    const d = _transferData ?? { ins: [], outs: [], loans: [] };

    const totalIn  = (d.ins  ?? []).reduce((s, t) => s + (t.fee ?? 0), 0);
    const totalOut = (d.outs ?? []).reduce((s, t) => s + (t.fee ?? 0), 0);
    const net = totalOut - totalIn;

    const fmt = v => `€${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;

    const playerRow = (p, type) => {
        const isIn = type === "in";
        const club  = isIn ? p.from : p.to;
        const arrow = isIn
            ? `<span class="th-arrow th-arrow--in">↓</span>`
            : `<span class="th-arrow th-arrow--out">↑</span>`;
        return `<div class="th-row">
            <div class="th-row-left">
                ${arrow}
                <span class="th-pos">${p.position ?? ""}</span>
                <div>
                    <div class="th-name">${p.name}</div>
                    <div class="th-club">${isIn ? "From" : "To"}: ${club ?? "—"}</div>
                </div>
            </div>
            <div class="th-fee ${isIn ? "th-fee--in" : "th-fee--out"}">${fmt(p.fee ?? 0)}</div>
        </div>`;
    };

    const loanRow = p => `<div class="th-row">
        <div class="th-row-left">
            <span class="th-arrow th-arrow--loan">↔</span>
            <span class="th-pos">${p.position ?? ""}</span>
            <div>
                <div class="th-name">${p.name}</div>
                <div class="th-club">${p.club ?? ""}${p.direction ? ` · ${p.direction}` : ""}</div>
            </div>
        </div>
        ${p.fee ? `<div class="th-fee">${fmt(p.fee)}</div>` : `<div class="th-loan-badge">Loan</div>`}
    </div>`;

    const empty = label => `<div class="th-empty-section">${label}</div>`;

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
                <span>⬇ Arrivals</span><span class="th-count">${(d.ins ?? []).length}</span>
            </div>
            ${(d.ins ?? []).length ? d.ins.map(p => playerRow(p, "in")).join("") : empty("No arrivals this season")}
        </div>

        <div class="th-section">
            <div class="th-section-header th-section-header--out">
                <span>⬆ Departures</span><span class="th-count">${(d.outs ?? []).length}</span>
            </div>
            ${(d.outs ?? []).length ? d.outs.map(p => playerRow(p, "out")).join("") : empty("No departures this season")}
        </div>

        <div class="th-section">
            <div class="th-section-header">
                <span>↔ Loans</span><span class="th-count">${(d.loans ?? []).length}</span>
            </div>
            ${(d.loans ?? []).length ? d.loans.map(loanRow).join("") : empty("No loans this season")}
        </div>

    </div>`;
}

// ── Scouting ─────────────────────────────────────────────────────────────

function buildScouting() {
    const s = _scoutReport?.scouting_arena;
    if (!s) return `<div class="sc-empty">No scouting data available.</div>`;

    const dotCol = d => ({ red:"#ef4444", orange:"#f97316", yellow:"#f59e0b", green:"#22c55e" }[d] ?? "#94a3b8");
    const dot    = (d, label) => `<span class="sa-dot" style="background:${dotCol(d)}"></span><span class="sa-feas-label">${label}</span>`;
    const stars  = (n, total=5) => `${"★".repeat(n)}${"☆".repeat(total-n)}`;

    const shortlistHtml = (s.shortlist ?? []).map(p => `
        <div class="sa-card" style="--sa-feas-color:${dotCol(p.feasibility_dot)}">
            <div class="sa-card-header">
                <div class="sa-card-identity">
                    <div class="sa-card-name">${p.name}</div>
                    <div class="sa-card-sub"><span class="sa-pos-badge">${p.position}</span> ${p.club}</div>
                </div>
                <div class="sa-card-vals">
                    <div class="sa-ovr-pot"><span class="sa-ovr">${p.ovr}</span><span class="sa-arrow-sep">→</span><span class="sa-pot">${p.pot}</span></div>
                    <div class="sa-value">${p.value}</div>
                </div>
            </div>
            <div class="sa-card-ratings">
                <div class="sa-rating-row"><span class="sa-rating-label">Footballing Fit</span><span class="sa-stars">${stars(p.fit_stars)}</span><span class="sa-fit-label">${p.fit_label}</span></div>
                <div class="sa-rating-row"><span class="sa-rating-label">Transfer Feasibility</span>${dot(p.feasibility_dot, p.feasibility_label)}</div>
            </div>
            <div class="sa-card-desc">${p.description}</div>
            ${p.barrier ? `<div class="sa-barrier">🚫 <strong>Major Barrier:</strong> ${p.barrier}</div>` : ""}
            ${p.verdict ? `<div class="sa-verdict">Scout Verdict: ${p.verdict}</div>` : ""}
        </div>`).join("");

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

    const wonderHtml = (s.wonderkids ?? []).map(p => `
        <div class="sa-wonder-card">
            <div class="sa-wonder-header"><span class="sa-wonder-flame">🔥</span><span class="sa-wonder-risk sa-wonder-risk--${p.risk.toLowerCase()}">${p.risk} Risk</span></div>
            <div class="sa-wonder-name">${p.name}</div>
            <div class="sa-wonder-meta">${p.position} · ${p.club}</div>
            <div class="sa-wonder-ovr">${p.ovr} <span class="sa-arrow-sep">→</span> <span class="sa-pot">${p.pot}</span></div>
            <div class="sa-wonder-value">${p.value}</div>
            <div class="sa-wonder-stars">${stars(p.pot_stars)}</div>
            <div class="sa-wonder-note">${p.note}</div>
        </div>`).join("");

    const eliteHtml = (s.elite_talent ?? []).map((p, i) => `
        <div class="sa-elite-row">
            <div class="sa-elite-rank">${String(i+1).padStart(2,"0")}</div>
            <div class="sa-elite-name">${p.name}</div>
            <div class="sa-elite-pos">${p.position}</div>
            <div class="sa-elite-ovr">${p.ovr} <span class="sa-arrow-sep">→</span> <span class="sa-pot">${p.pot}</span></div>
        </div>`).join("");

    const specialistHtml = (s.specialist ?? []).map(group => `
        <div class="sa-spec-group">
            <div class="sa-spec-category">${group.category}</div>
            ${group.players.map(p => `
            <div class="sa-spec-row">
                <div class="sa-spec-left"><span class="sa-spec-name">${p.name}</span><span class="sa-spec-club">${p.club}</span></div>
                <div class="sa-spec-badge">${p.attr} ${p.val}</div>
                <div class="sa-spec-note">${p.note}</div>
            </div>`).join("")}
        </div>`).join("");

    const avoidHtml = (s.avoid ?? []).map(p => {
        const isDnp = p.status === "Do Not Pursue";
        return `<div class="sa-avoid-row ${isDnp ? "sa-avoid-row--dnp" : ""}">
            <div class="sa-avoid-top"><div class="sa-avoid-name">${isDnp ? "❌" : "🚫"} ${p.name}</div><span class="sa-avoid-status">${p.status}</span></div>
            <div class="sa-avoid-meta">${p.position} · ${p.club}</div>
            <div class="sa-avoid-reason">${p.reason}</div>
        </div>`;
    }).join("");

    const count = a => `<span class="sc-block-count">${a.length}</span>`;
    return `<div class="sc-page">
        <div class="sa-arena-header"><div><div class="sa-arena-title">🏟️ Scouting Arena</div><div class="sa-arena-sub">${_season.club ?? "Club"} · ${_season.season ?? ""}</div></div></div>
        <div class="sc-block sc-block--gold"><div class="sc-block-title">🎯 Shortlist ${count(s.shortlist ?? [])}</div><div class="sa-cards">${shortlistHtml}</div></div>
        <div class="sc-block sc-block--blue"><div class="sc-block-title">👀 Keep an Eye On ${count(s.watchlist ?? [])}</div><div class="sa-watchlist">${watchHtml}</div></div>
        <div class="sc-block sc-block--purple"><div class="sc-block-title">🌱 Wonderkids ${count(s.wonderkids ?? [])}</div><div class="sa-wonder-grid">${wonderHtml}</div></div>
        <div class="sc-block sc-block--white"><div class="sc-block-title">💎 Elite Talent ${count(s.elite_talent ?? [])}</div><div class="sa-elite-list">${eliteHtml}</div></div>
        <div class="sc-block sc-block--gold"><div class="sc-block-title">⚡ Specialist Watchlist</div><div class="sa-specialist">${specialistHtml}</div></div>
        <div class="sc-block sc-block--red"><div class="sc-block-title">🚫 Transfers to Avoid ${count(s.avoid ?? [])}</div><div class="sa-avoid-list">${avoidHtml}</div></div>
    </div>`;
}

// ── Event binding ────────────────────────────────────────────────────────

function bindEvents(root) {
    root.querySelector("#tr-view-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".tr-view-tab");
        if (!btn) return;
        _view = btn.dataset.view;
        root.querySelectorAll(".tr-view-tab").forEach(b => b.classList.toggle("active", b === btn));
        root.querySelector("#tr-view-body").innerHTML = buildView();
    });
}
