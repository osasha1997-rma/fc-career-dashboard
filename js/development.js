// ==========================================
// CareerOS — Development Centre
// ==========================================

const CONTRACT_REF_YEAR = 2027, CONTRACT_REF_MONTH = 9;

function monthsLeft(expiry) {
    if (!expiry || expiry === "-") return null;
    const [y, m] = expiry.split("-").map(Number);
    return (y - CONTRACT_REF_YEAR) * 12 + (m - CONTRACT_REF_MONTH);
}

function expiryLabel(months) {
    if (months === null) return "—";
    if (months <= 6)  return `${months}mo ⚠`;
    if (months <= 12) return `${months}mo`;
    const yrs = Math.floor(months / 12);
    const rem  = months % 12;
    return rem ? `${yrs}y ${rem}mo` : `${yrs}y`;
}

export function renderDevelopment(players = [], academy = []) {
    const active = players.filter(p => !p.loan);
    const loaned = players.filter(p => p.loan);

    const growthPlayers = [...players]
        .filter(p => p.potential > p.overall)
        .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall));

    const maxGap   = growthPlayers[0] ? growthPlayers[0].potential - growthPlayers[0].overall : 1;
    const pipeline = players.filter(p => p.age <= 24 || p.role === "Prospect").length;
    const totalCeiling = players.reduce((s, p) => s + Math.max(0, p.potential - p.overall), 0);
    const avgPot   = Math.round(players.reduce((s, p) => s + p.potential, 0) / (players.length || 1));

    const readyToStep = active.filter(p => p.age <= 23 && p.overall >= 75 && p.role === "Prospect");
    const needsLoan   = active.filter(p => p.age <= 22 && p.role === "Prospect" && p.potential >= 75);
    const youth       = players.filter(p => p.age <= 21).sort((a, b) => b.potential - a.potential);

    return `<section class="dev-page fade">
        <div class="page-header">
            <h1>Development Centre</h1>
            <p>Youth Pipeline · Season 2027/28</p>
        </div>

        ${renderOverview(pipeline, totalCeiling, loaned.length, avgPot)}
        ${growthPlayers.length ? renderGrowthCeiling(growthPlayers, maxGap) : ""}
        ${renderPriorityFlags(readyToStep, needsLoan)}
        ${loaned.length ? renderLoanWatch(loaned) : ""}
        ${youth.length ? renderYouthPipeline(youth) : ""}
        ${academy.length ? renderAcademy(academy) : ""}
    </section>`;
}

// ── Overview pills ────────────────────────────────────────────

function renderOverview(pipeline, ceiling, onLoan, avgPot) {
    const pills = [
        { v: pipeline, l: "In Pipeline",    c: "#a78bfa" },
        { v: `+${ceiling}`, l: "Total Growth", c: "#D4AF37" },
        { v: onLoan,   l: "Out on Loan",    c: "#60a5fa" },
        { v: avgPot,   l: "Avg Potential",  c: "#22c55e" },
    ];
    return `<div class="dev-pills">
        ${pills.map(p => `
        <div class="dev-pill">
            <span class="dev-pill-v" style="color:${p.c}">${p.v}</span>
            <span class="dev-pill-l">${p.l}</span>
        </div>`).join("")}
    </div>`;
}

// ── Growth Ceiling ────────────────────────────────────────────

function renderGrowthCeiling(players, maxGap) {
    return `<div class="dev-block">
        <div class="dev-block-header">
            <span class="dev-block-title">Growth Ceiling</span>
            <span class="dev-block-icon">📈</span>
        </div>
        <div class="dev-growth-list">
            ${players.map(p => {
                const gap     = p.potential - p.overall;
                const ovrPct  = ((p.overall - 50) / 50 * 100).toFixed(1);
                const gainPct = (gap / 50 * 100).toFixed(1);
                const barW    = (gap / maxGap * 100).toFixed(1);
                return `<div class="dev-growth-row">
                    <div class="dev-growth-meta">
                        <span class="dev-pos-badge">${p.position}</span>
                        <span class="dev-growth-name">${p.name}</span>
                        <span class="dev-growth-age">Age ${p.age}</span>
                        ${p.loan ? `<span class="dev-loan-chip">${p.loanClub}</span>` : ""}
                    </div>
                    <div class="dev-growth-right">
                        <div class="dev-growth-track">
                            <div class="dev-growth-base" style="width:${ovrPct}%"></div>
                            <div class="dev-growth-gain" style="width:${gainPct}%"></div>
                        </div>
                        <div class="dev-growth-nums">
                            <span class="dev-ovr">${p.overall}</span>
                            <span class="dev-arrow">→</span>
                            <span class="dev-pot">${p.potential}</span>
                            <span class="dev-gain-badge">+${gap}</span>
                        </div>
                    </div>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

// ── Priority Flags ────────────────────────────────────────────

function renderPriorityFlags(readyToStep, needsLoan) {
    if (!readyToStep.length && !needsLoan.length) return "";
    const item = (text, type) => `<div class="dev-advice dev-advice--${type}">${text}</div>`;

    return `<div class="dev-block">
        <div class="dev-block-header">
            <span class="dev-block-title">Priority Actions</span>
            <span class="dev-block-icon">🎯</span>
        </div>

        ${readyToStep.length ? `
        <div class="dev-flag-group">
            <div class="dev-flag-title">⬆️ Ready to Step Up</div>
            ${readyToStep.map(p => `<div class="dev-player-row">
                <span class="dev-pos-badge">${p.position}</span>
                <span class="dev-player-name">${p.name}</span>
                <span class="dev-player-meta">Age ${p.age} · ${p.overall} OVR · POT ${p.potential}</span>
            </div>`).join("")}
            ${item("These Prospects are performing above their role. Consider promoting to Rotation.", "ok")}
        </div>` : ""}

        ${needsLoan.length ? `
        <div class="dev-flag-group">
            <div class="dev-flag-title">✈️ Needs Loan Experience</div>
            ${needsLoan.map(p => `<div class="dev-player-row">
                <span class="dev-pos-badge">${p.position}</span>
                <span class="dev-player-name">${p.name}</span>
                <span class="dev-player-meta">Age ${p.age} · POT ${p.potential}</span>
            </div>`).join("")}
            ${item("Young high-potential players sitting unused. Send them on loan for regular football.", "warn")}
        </div>` : ""}
    </div>`;
}

// ── Loan Watch ────────────────────────────────────────────────

function renderLoanWatch(loaned) {
    return `<div class="dev-block">
        <div class="dev-block-header">
            <span class="dev-block-title">Loan Watch (${loaned.length})</span>
            <span class="dev-block-icon">🔁</span>
        </div>
        <div class="dev-loan-list">
            ${loaned.map(p => {
                const ml = monthsLeft(p.contractExpiry);
                const contractCol = ml !== null && ml <= 12 ? "#f59e0b" : "var(--text-secondary)";
                return `<div class="dev-loan-row">
                    <div class="dev-loan-left">
                        <span class="dev-pos-badge">${p.position}</span>
                        <div>
                            <div class="dev-loan-name">${p.name}</div>
                            <div class="dev-loan-club">${p.loanClub ?? "Unknown"}</div>
                        </div>
                    </div>
                    <div class="dev-loan-right">
                        <span class="dev-loan-age">Age ${p.age}</span>
                        <span class="dev-ovr-pair">${p.overall}<span class="dev-arrow">→</span><span class="dev-pot">${p.potential}</span></span>
                        <span class="dev-loan-expiry" style="color:${contractCol}">${expiryLabel(ml)}</span>
                    </div>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

// ── Youth Pipeline ────────────────────────────────────────────

function renderYouthPipeline(youth) {
    return `<div class="dev-block">
        <div class="dev-block-header">
            <span class="dev-block-title">Youth Pipeline (U21)</span>
            <span class="dev-block-icon">🌟</span>
        </div>
        <div class="dev-youth-grid">
            ${youth.map(p => {
                const gap     = p.potential - p.overall;
                const ovrPct  = ((p.overall - 50) / 50 * 100).toFixed(1);
                const gainPct = (gap / 50 * 100).toFixed(1);
                const roleColor = { Crucial:"#D4AF37", Important:"#60a5fa", Rotation:"#94a3b8", Prospect:"#a78bfa", Sporadic:"#f97316" }[p.role] ?? "#94a3b8";
                return `<div class="dev-youth-card">
                    <div class="dev-youth-top">
                        <span class="dev-pos-badge">${p.position}</span>
                        <span class="dev-youth-name">${p.name}</span>
                        <span class="dev-youth-age">Age ${p.age}</span>
                    </div>
                    <div class="dev-youth-nums">
                        <span class="dev-ovr">${p.overall}</span>
                        <span class="dev-arrow">→</span>
                        <span class="dev-pot">${p.potential}</span>
                        <span class="dev-gain-badge">+${gap}</span>
                    </div>
                    <div class="dev-growth-track dev-growth-track--sm">
                        <div class="dev-growth-base" style="width:${ovrPct}%"></div>
                        <div class="dev-growth-gain" style="width:${gainPct}%"></div>
                    </div>
                    <div class="dev-youth-footer">
                        <span class="dev-role-tag" style="color:${roleColor}">${p.role}</span>
                        ${p.loan ? `<span class="dev-loan-chip">${p.loanClub}</span>` : ""}
                        ${p.nationality ? `<span class="dev-nationality">${p.nationality}</span>` : ""}
                    </div>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}

// ── Youth Academy ─────────────────────────────────────────────

function renderAcademy(academy) {
    const prospects   = academy.filter(p => p.role === "Prospect");
    const development = academy.filter(p => p.role === "Development");
    const avgPotMid   = Math.round(academy.reduce((s, p) => s + (p.potentialLow + p.potentialHigh) / 2, 0) / academy.length);

    return `<div class="dev-block">
        <div class="dev-block-header">
            <span class="dev-block-title">Youth Academy (${academy.length})</span>
            <span class="dev-block-icon">🏫</span>
        </div>
        <div class="dev-academy-meta">
            <span>${prospects.length} Prospects</span>
            <span>${development.length} Development</span>
            <span>Avg ceiling ~${avgPotMid}</span>
        </div>
        <div class="dev-academy-list">
            ${academy.map(p => {
                const ceiling  = p.potentialLow - p.overall;
                const ovrPct   = ((p.overall - 40) / 60 * 100).toFixed(1);
                const gainPct  = ((p.potentialHigh - p.overall) / 60 * 100).toFixed(1);
                const roleColor = p.role === "Prospect" ? "#a78bfa" : "#94a3b8";
                return `<div class="dev-academy-card">
                    <div class="dev-academy-top">
                        <span class="dev-pos-badge">${p.position}</span>
                        <div class="dev-academy-identity">
                            <span class="dev-academy-name">${p.name}</span>
                            <span class="dev-academy-sub">${p.nationality} · Age ${p.age} · ${p.preferredFoot} foot</span>
                        </div>
                        <span class="dev-role-tag" style="color:${roleColor}">${p.role}</span>
                    </div>
                    <div class="dev-academy-stats">
                        <div class="dev-academy-ovr">
                            <span class="dev-ovr">${p.overall}</span>
                            <span class="dev-arrow">→</span>
                            <span class="dev-pot">${p.potentialLow}–${p.potentialHigh}</span>
                            <span class="dev-gain-badge">+${ceiling}–+${p.potentialHigh - p.overall}</span>
                        </div>
                        <span class="dev-intake-year">Intake ${p.intakeYear}</span>
                    </div>
                    <div class="dev-growth-track dev-growth-track--sm">
                        <div class="dev-growth-base" style="width:${ovrPct}%"></div>
                        <div class="dev-growth-gain" style="width:${gainPct}%"></div>
                    </div>
                </div>`;
            }).join("")}
        </div>
    </div>`;
}
