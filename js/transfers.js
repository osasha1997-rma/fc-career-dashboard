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

export async function initializeTransfers() {
    try {
        [_fc26, _scoutReport, _transferData] = await Promise.all([
            loadFC26(),
            fetch(`data/scout-report.json?v=${Date.now()}`).then(r => r.json()).catch(() => null),
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

// ── AI Scout tab ─────────────────────────────────────────────────────────

function buildAIScout() {
    return `<div class="tr-ai-wrap">
        ${_scoutReport ? renderScoutReport(_scoutReport) : '<div class="tr-ai-placeholder"><div class="tr-ai-icon">🤖</div><div class="tr-ai-title">No Scout Report</div><div class="tr-ai-desc">Add a report to data/scout-report.json to display it here.</div></div>'}
    </div>`;
}

function renderScoutReport(r) {
    const statusColor = s => {
        if (s.includes("Elite") || s.includes("Critical") || s.includes("Key")) return "#ef4444";
        if (s.includes("Development")) return "#f59e0b";
        return "#60a5fa";
    };

    const sections = r.sections.map(s => {
        if (s.type === "rating") return `
            <div class="gpt-section gpt-section--rating">
                <div class="gpt-overall-score">${r.rating}<span>/10</span></div>
                <div class="gpt-overall-label">Overall Squad Rating</div>
                <p class="gpt-body">${s.content}</p>
            </div>`;

        if (s.type === "positive" || s.type === "warning" || s.type === "negative") {
            const accent = s.type === "positive" ? "#22c55e" : s.type === "warning" ? "#f59e0b" : "#ef4444";
            const itemsHtml = s.items ? s.items.map(item => `
                <div class="gpt-item">
                    <div class="gpt-item-heading">${item.heading}</div>
                    <p class="gpt-body">${item.body}</p>
                    ${item.verdict ? `<div class="gpt-verdict" style="border-color:${accent}">Scout verdict: ${item.verdict}</div>` : ""}
                </div>`).join("") : `<p class="gpt-body">${s.content}</p>`;
            return `
            <div class="gpt-section">
                <div class="gpt-section-title" style="color:${accent}">${s.icon} ${s.title}</div>
                ${itemsHtml}
            </div>`;
        }

        if (s.type === "players") return `
            <div class="gpt-section">
                <div class="gpt-section-title" style="color:#f59e0b">${s.icon} ${s.title}</div>
                <div class="gpt-player-grid">
                    ${s.items.map(p => `
                    <div class="gpt-player-card">
                        <div class="gpt-player-name">${p.name}</div>
                        <div class="gpt-player-status" style="color:${statusColor(p.status)}">${p.status}</div>
                        <div class="gpt-player-note">${p.note}</div>
                    </div>`).join("")}
                </div>
            </div>`;

        if (s.type === "lineup") return `
            <div class="gpt-section">
                <div class="gpt-section-title" style="color:#60a5fa">${s.icon} ${s.title}</div>
                <div class="gpt-lineup-wrap">
                    <div class="gpt-lineup-col">
                        <div class="gpt-lineup-label">Starting XI</div>
                        ${s.first_xi.map(row => `<div class="gpt-lineup-row">${row}</div>`).join("")}
                    </div>
                    <div class="gpt-lineup-col">
                        <div class="gpt-lineup-label">Rotation</div>
                        <div class="gpt-rotation-grid">
                            ${s.rotation.map(p => `<div class="gpt-rotation-badge">${p}</div>`).join("")}
                        </div>
                    </div>
                </div>
                <p class="gpt-body" style="margin-top:10px">${s.note}</p>
            </div>`;

        if (s.type === "transfer") return `
            <div class="gpt-section">
                <div class="gpt-section-title" style="color:#a78bfa">${s.icon} ${s.title}</div>
                <div class="gpt-priority gpt-priority--${s.priority.toLowerCase()}">Priority: ${s.priority}</div>
                <ol class="gpt-list">${s.points.map(p => `<li>${p}</li>`).join("")}</ol>
                <p class="gpt-body">${s.note}</p>
            </div>`;

        if (s.type === "tactical") return `
            <div class="gpt-section">
                <div class="gpt-section-title" style="color:#34d399">${s.icon} ${s.title}</div>
                <p class="gpt-body">${s.content}</p>
            </div>`;

        if (s.type === "final") return `
            <div class="gpt-section gpt-section--final">
                <div class="gpt-section-title" style="color:var(--primary)">${s.icon} ${s.title}</div>
                <div class="gpt-scores-grid">
                    ${s.scores.map(sc => `
                    <div class="gpt-score-item">
                        <div class="gpt-score-val">${sc.score}</div>
                        <div class="gpt-score-label">${sc.label}</div>
                    </div>`).join("")}
                </div>
                <p class="gpt-body" style="margin-top:12px"><strong>${s.summary}</strong></p>
            </div>`;

        return "";
    }).join("");

    return `
    <div class="gpt-report">
        <div class="gpt-report-header">
            <div class="gpt-report-title">🤖 AI Scout — Real Madrid</div>
            <div class="gpt-report-meta">Generated ${r.generated} · ${r.source}</div>
        </div>
        ${sections}
    </div>`;
}

function generateSquadReport_UNUSED() {
    // Exclude players currently out on loan — they don't count toward squad strength
    const activePlayers = _players.filter(p => !p.loan);

    const played  = _matches.filter(m => m.result);
    const wins    = played.filter(m => m.result === "W").length;
    const draws   = played.filter(m => m.result === "D").length;
    const losses  = played.filter(m => m.result === "L").length;
    const gf      = played.reduce((s, m) => s + (m.scoreFor ?? 0), 0);
    const ga      = played.reduce((s, m) => s + (m.scoreAgainst ?? 0), 0);
    const cs      = played.filter(m => (m.scoreAgainst ?? 0) === 0).length;
    const avgPoss = played.length
        ? Math.round(played.reduce((s, m) => s + (m.teamStats?.possession ?? 50), 0) / played.length)
        : 50;
    const form5   = played.slice(-5).map(m => m.result);
    const pts     = wins * 3 + draws;
    const ppg     = played.length ? (pts / played.length).toFixed(2) : "—";

    // Position group averages
    const groups = { GK: [], DEF: [], MID: [], ATT: [] };
    const groupOf = p => {
        const pos = p.position;
        if (pos === "GK") return "GK";
        if (["CB","LB","RB","LWB","RWB"].includes(pos)) return "DEF";
        if (["CDM","CM","CAM","LM","RM"].includes(pos)) return "MID";
        return "ATT";
    };
    activePlayers.forEach(p => groups[groupOf(p)].push(p));
    const avgOvr = grp => grp.length
        ? Math.round(grp.reduce((s, p) => s + p.overall, 0) / grp.length) : 0;

    // FC26 attribute averages — active squad only
    const fc26Squad = activePlayers.map(p => _squadMap[p.id]).filter(Boolean);
    const avgAttr = key => fc26Squad.length
        ? Math.round(fc26Squad.reduce((s, p) => s + (p[key] ?? 0), 0) / fc26Squad.length) : 0;

    // Weakest position group
    const groupAvgs = { DEF: avgOvr(groups.DEF), MID: avgOvr(groups.MID), ATT: avgOvr(groups.ATT) };
    const weakestGroup = Object.entries(groupAvgs).sort((a, b) => a[1] - b[1])[0];

    // Sell candidates — active players only
    const sellCandidates = activePlayers
        .filter(p => (p.overall < 78 && p.age > 29) || p.overall < 75)
        .sort((a, b) => a.overall - b.overall)
        .slice(0, 4);

    // High potential youngsters — active players only
    const gems = activePlayers
        .filter(p => p.age <= 24 && (p.potential - p.overall) >= 4)
        .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall))
        .slice(0, 4);

    // Best squad FC26 attributes
    const avgPace = avgAttr("pace");
    const avgDef  = avgAttr("defending");
    const avgPas  = avgAttr("passing");

    // Position gaps — active players only
    const posCounts = {};
    activePlayers.forEach(p => { posCounts[p.position] = (posCounts[p.position] ?? 0) + 1; });
    const thinPositions = Object.entries(posCounts).filter(([,c]) => c === 1).map(([p]) => p);

    // Form colour helper
    const formBadge = r => {
        const col = r === "W" ? "#22c55e" : r === "D" ? "#f59e0b" : "#ef4444";
        return `<span class="sr-form-badge" style="background:${col}">${r}</span>`;
    };

    // Strength assessment
    const defStrength = avgDef >= 80 ? "solid" : avgDef >= 75 ? "decent" : "shaky";
    const paceRating  = avgPace >= 80 ? "pacey" : avgPace >= 75 ? "decent pace" : "slow";
    const buildupRating = avgPas >= 80 ? "excellent build-up play" : avgPas >= 75 ? "comfortable on the ball" : "struggles in possession";

    return `
    <div class="sr-section">
        <div class="sr-section-title">📊 Season Snapshot</div>
        <div class="sr-stats-row">
            <div class="sr-stat"><div class="sr-stat-val">${wins}W ${draws}D ${losses}L</div><div class="sr-stat-label">Record</div></div>
            <div class="sr-stat"><div class="sr-stat-val">${ppg}</div><div class="sr-stat-label">Pts/Game</div></div>
            <div class="sr-stat"><div class="sr-stat-val">${gf}–${ga}</div><div class="sr-stat-label">Goals</div></div>
            <div class="sr-stat"><div class="sr-stat-val">${avgPoss}%</div><div class="sr-stat-label">Avg Poss</div></div>
            <div class="sr-stat"><div class="sr-stat-val">${cs}</div><div class="sr-stat-label">Clean Sheets</div></div>
        </div>
        <div class="sr-form-row">
            <span class="sr-form-label">Last 5</span>
            ${form5.map(formBadge).join("")}
        </div>
    </div>

    <div class="sr-section">
        <div class="sr-section-title">⚽ Tactical Analysis</div>
        <div class="sr-section-body">
            Playing <strong>${_season.formation ?? "4-2-3-1"}</strong> under <strong>${_season.manager ?? "Manager"}</strong>, the team averages
            <strong>${avgPoss}%</strong> possession — a ${avgPoss >= 55 ? "dominant, possession-based" : avgPoss >= 48 ? "balanced" : "direct, counter-attacking"} style.
            With <strong>${ppg} points per game</strong> and <strong>${cs} clean sheets</strong> in ${played.length} games, the
            ${wins > losses ? "team is in good form" : losses > wins ? "results need improvement" : "season is inconsistent"}.
            The squad has ${paceRating}, ${buildupRating}, and a <strong>${defStrength}</strong> defensive line (avg DEF: ${avgDef}).
        </div>
    </div>

    <div class="sr-section">
        <div class="sr-section-title">🔴 Squad Weaknesses</div>
        <div class="sr-section-body">
            <ul class="sr-list">
                <li><strong>${weakestGroup[0]}</strong> is the weakest line — average OVR <strong>${weakestGroup[1]}</strong> vs squad average <strong>${Math.round(Object.values(groupAvgs).reduce((s,v)=>s+v,0)/3)}</strong>. Needs reinforcement.</li>
                ${thinPositions.length ? `<li>Depth issue at <strong>${thinPositions.join(", ")}</strong> — only one player per position. One injury and the system breaks.</li>` : ""}
                ${avgPace < 77 ? `<li>Squad pace (avg: ${avgPace}) is below elite level — can be exposed by high defensive lines and counter-attacks.</li>` : ""}
                ${ga > gf ? `<li>Conceding more than scoring (${ga} GA vs ${gf} GF) — defensive structure needs urgent attention.</li>` : ""}
                ${avgDef < 76 ? `<li>Defensive attributes are weak (avg DEF: ${avgDef}) — a ball-playing CB or a pressing CDM would help.</li>` : ""}
            </ul>
        </div>
    </div>

    <div class="sr-section">
        <div class="sr-section-title">🎯 Transfer Priorities</div>
        <div class="sr-section-body">
            <ul class="sr-list">
                <li>Priority: <strong>${weakestGroup[0]}</strong> — target OVR 82+, age ≤ 27, fitting the ${_season.formation ?? "4-2-3-1"} shape.</li>
                ${thinPositions.slice(0,2).map(p => `<li>Backup <strong>${p}</strong> — a reliable squad player (OVR 78+) to cover depth.</li>`).join("")}
                ${avgPace < 77 ? `<li>Add pace — a winger or fullback with PAC 85+ would open the pitch on transitions.</li>` : ""}
                <li>Budget available: <strong>€${(((_season.transferBudget ?? 0)) / 1e6).toFixed(0)}M</strong> — ${(_season.transferBudget ?? 0) >= 50e6 ? "enough for a marquee signing" : (_season.transferBudget ?? 0) >= 20e6 ? "two solid additions are realistic" : "focus on loans or free agents"}.</li>
            </ul>
        </div>
    </div>

    ${sellCandidates.length ? `
    <div class="sr-section">
        <div class="sr-section-title">📤 Consider Moving On</div>
        <div class="sr-section-body">
            <div class="sr-sell-grid">
                ${sellCandidates.map(p => `
                <div class="sr-sell-card">
                    <div class="sr-sell-name">${p.name}</div>
                    <div class="sr-sell-meta">${p.position} · ${p.age}y · OVR ${p.overall}</div>
                    <div class="sr-sell-reason">${p.overall < 75 ? "Below squad standard" : `Age ${p.age} + OVR ${p.overall} — limited upside`}</div>
                </div>`).join("")}
            </div>
        </div>
    </div>` : ""}

    ${gems.length ? `
    <div class="sr-section">
        <div class="sr-section-title">🌟 Future Stars to Keep</div>
        <div class="sr-section-body">
            <div class="sr-sell-grid">
                ${gems.map(p => `
                <div class="sr-sell-card sr-sell-card--gem">
                    <div class="sr-sell-name">${p.name}</div>
                    <div class="sr-sell-meta">${p.position} · ${p.age}y · OVR ${p.overall}</div>
                    <div class="sr-sell-reason">POT ${p.potential} — ${p.potential - p.overall} OVR growth remaining</div>
                </div>`).join("")}
            </div>
        </div>
    </div>` : ""}
    `;
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
                <div class="sa-arena-sub">Real Madrid · ${_season.season ?? ""}</div>
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

// ── (Old rule-based suggestions — kept for reference) ────────────────────

function buildSuggestions() {
    const gaps = analyzeSquadGaps();
    const categories = buildSuggestionCategories(gaps);

    return `<div class="tr-suggestions">
        ${gaps.length ? `<div class="tr-gap-banner">
            <span class="tr-gap-icon">⚠️</span>
            <div>
                <div class="tr-gap-title">Squad Gaps Detected</div>
                <div class="tr-gap-desc">${gaps.map(g => g.label).join(" · ")}</div>
            </div>
        </div>` : `<div class="tr-gap-banner tr-gap-banner--ok">
            <span class="tr-gap-icon">✅</span>
            <div><div class="tr-gap-title">Squad looks balanced</div></div>
        </div>`}
        ${categories.map(cat => buildSuggestionCategory(cat)).join("")}
    </div>`;
}

function analyzeSquadGaps() {
    const gaps = [];
    const fc26Squad = Object.values(_squadMap);

    // Check GK depth
    const gks = _players.filter(p => p.position === "GK");
    if (gks.length < 2) gaps.push({ key: "gk", label: "Need backup GK" });

    // Check positions coverage by OVR
    const positionGroups = { CB: [], LB: [], RB: [], CDM: [], CM: [], CAM: [], LW: [], RW: [], ST: [] };
    fc26Squad.forEach(p => {
        const primaryPos = (p.player_positions || "").split(",")[0].trim();
        if (positionGroups[primaryPos]) positionGroups[primaryPos].push(p.overall);
    });

    if (!positionGroups.LB.length || Math.max(...positionGroups.LB) < 80) gaps.push({ key: "lb", label: "Weak LB" });
    if (!positionGroups.CDM.length || Math.max(...positionGroups.CDM) < 80) gaps.push({ key: "cdm", label: "Weak CDM" });
    if (positionGroups.ST.length < 2) gaps.push({ key: "st", label: "Need 2nd ST" });

    return gaps;
}

function buildSuggestionCategories(gaps) {
    const cats = [];

    // Gap-based
    gaps.forEach(g => {
        if (g.key === "lb") cats.push(suggestByPosition("LB", "Best Left Backs", "🔴 Squad Need"));
        if (g.key === "cdm") cats.push(suggestByPosition("CDM", "Best CDMs", "🔴 Squad Need"));
        if (g.key === "st") cats.push(suggestByPosition("ST", "Best Strikers", "🔴 Squad Need"));
    });

    // Always show
    cats.push(suggestWonderkids());
    cats.push(suggestFreeAgents());
    cats.push(suggestByAttribute("movement_sprint_speed", "⚡ Fastest Players", "All", 88));
    cats.push(suggestByPosition("CAM", "Top Attacking Mids", "🌟 Upgrade"));
    cats.push(suggestByPosition("CB", "Top Centre Backs", "🌟 Upgrade"));

    return cats.filter(Boolean);
}

function suggestByPosition(pos, title, badge) {
    const players = _fc26
        .filter(p => (p.player_positions || "").includes(pos) && p.overall >= 78 && p.age <= 28)
        .sort((a, b) => b.overall - a.overall || b.potential - a.potential)
        .slice(0, 6);
    return { title, badge, players };
}

function suggestWonderkids() {
    const players = _fc26
        .filter(p => p.age <= 21 && p.potential >= 84 && p.overall >= 72)
        .sort((a, b) => b.potential - a.potential || a.age - b.age)
        .slice(0, 6);
    return { title: "🌱 Wonderkids (U21)", badge: "High Potential", players };
}

function suggestFreeAgents() {
    const players = _fc26
        .filter(p => p.overall >= 78 && (!p.club_name || p.club_name === ""))
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 6);
    if (!players.length) {
        // Fallback: expiring contracts
        const expiring = _fc26.filter(p => p.club_contract_valid_until_year <= 2028 && p.overall >= 78);
        return { title: "📋 Expiring Contracts", badge: "Bosman Risk", players: expiring.sort((a,b) => b.overall - a.overall).slice(0,6) };
    }
    return { title: "🆓 Free Agents (78+ OVR)", badge: "No Transfer Fee", players };
}

function suggestByAttribute(attr, title, pos, minVal) {
    let base = _fc26.filter(p => (p[attr] ?? 0) >= minVal && p.overall >= 76);
    if (pos !== "All") base = base.filter(p => (p.player_positions || "").includes(pos));
    const players = base.sort((a, b) => (b[attr] ?? 0) - (a[attr] ?? 0)).slice(0, 6);
    return { title, badge: `${attr.replace(/_/g," ")} ≥ ${minVal}`, players };
}

function buildSuggestionCategory({ title, badge, players }) {
    if (!players.length) return "";
    return `<div class="tr-cat">
        <div class="tr-cat-header">
            <span class="tr-cat-title">${title}</span>
            <span class="tr-cat-badge">${badge}</span>
        </div>
        <div class="tr-card-row">
            ${players.map(p => playerCard(p)).join("")}
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
        bindAIEvents(root);
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
