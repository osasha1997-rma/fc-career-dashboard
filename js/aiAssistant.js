// ==========================================
// CareerOS — AI Assistant Screen
// ==========================================

const TABS = [
    { k: "squad",    l: "Squad Advice" },
    { k: "match",    l: "Upcoming Match" },
    { k: "transfer", l: "Transfer Advice" },
    { k: "contract", l: "Contract Advice" },
    { k: "youth",    l: "Youth / Loan" },
    { k: "tactical", l: "Tactical Suggestions" },
];

let _activeTab = "squad";

function posGroup(pos) {
    if (pos === "GK") return "GK";
    if (["LB","CB","RB","LWB","RWB"].includes(pos)) return "DEF";
    if (["CDM","CM","CAM","LM","RM"].includes(pos)) return "MID";
    return "FWD";
}

// ── Tab bar ───────────────────────────────────────────────────

function tabBar() {
    return `<div class="aia-tabs" id="aia-tabs">
        ${TABS.map(t => `<button class="aia-tab${t.k === _activeTab ? " active" : ""}" data-tab="${t.k}">${t.l}</button>`).join("")}
    </div>`;
}

// ── Squad Advice ──────────────────────────────────────────────

function buildSquadAdvice(players) {
    const active = players.filter(p => !p.loan);

    const byPos = {};
    for (const p of active) {
        const g = posGroup(p.position);
        if (!byPos[g]) byPos[g] = [];
        byPos[g].push(p);
    }
    const sorted = g => (byPos[g] ?? []).sort((a, b) => b.overall - a.overall);
    const gks = sorted("GK"), defs = sorted("DEF"), mids = sorted("MID"), fwds = sorted("FWD");

    const depthStatus = (count, min, ideal) => {
        if (count < min)   return { cls: "sqa-ds--critical", label: "Critical" };
        if (count < ideal) return { cls: "sqa-ds--low",      label: "Low" };
        return               { cls: "sqa-ds--good",          label: "Good" };
    };
    const depthMeter = (count, ideal) => {
        const dots = Array.from({ length: ideal }, (_, i) =>
            `<span class="sqa-dot ${i < count ? "sqa-dot--filled" : ""}"></span>`).join("");
        return `<div class="sqa-dots">${dots}${count > ideal ? `<span class="sqa-dot-extra">+${count - ideal}</span>` : ""}</div>`;
    };

    const avgAge = (active.reduce((s, p) => s + (p.age ?? 0), 0) / (active.length || 1)).toFixed(1);
    const veterans  = active.filter(p => p.age >= 32).sort((a, b) => b.age - a.age);
    const youngGems = active.filter(p => p.age <= 22 && p.potential > p.overall).sort((a, b) => b.potential - a.potential);
    const u21 = active.filter(p => p.age <= 21).length;
    const b2126 = active.filter(p => p.age >= 22 && p.age <= 26).length;
    const b2731 = active.filter(p => p.age >= 27 && p.age <= 31).length;
    const over32 = active.filter(p => p.age >= 32).length;
    const tot = active.length || 1;

    const roleCounts = { Crucial: 0, Important: 0, Rotation: 0, Prospect: 0 };
    for (const p of active) if (roleCounts[p.role] !== undefined) roleCounts[p.role]++;
    const roleTotal = Object.values(roleCounts).reduce((a, b) => a + b, 0) || 1;
    const roleStyle = { Crucial: "#D4AF37", Important: "#60a5fa", Rotation: "#94a3b8", Prospect: "#a78bfa" };

    const devTargets = active
        .filter(p => p.potential - p.overall >= 5 && p.age <= 24)
        .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall)).slice(0, 5);

    return `<div class="sqa-wrap">
        <div class="sqa-block sqa-block--gold">
            <div class="sqa-block-header"><span class="sqa-block-title">Squad Depth</span><span class="sqa-block-icon">🧱</span></div>
            <div class="sqa-lines">
                ${[["GK","Goalkeepers",gks,2,3],["DEF","Defenders",defs,4,6],["MID","Midfielders",mids,4,6],["FWD","Forwards",fwds,3,5]]
                .map(([k,label,list,min,ideal]) => {
                    const ds = depthStatus(list.length, min, ideal);
                    return `<div class="sqa-line-row">
                        <div class="sqa-line-left">
                            <span class="sqa-line-pos">${k}</span>
                            <div>
                                <div class="sqa-line-label">${label}</div>
                                <div class="sqa-line-names">${list.slice(0,2).map(p=>p.name.split(" ").slice(-1)[0]).join(", ")}${list.length>2?` +${list.length-2}`:""}</div>
                            </div>
                        </div>
                        <div class="sqa-line-right">
                            ${depthMeter(list.length, ideal)}
                            <span class="sqa-ds ${ds.cls}">${list.length} · ${ds.label}</span>
                        </div>
                    </div>`;
                }).join("")}
            </div>
        </div>

        <div class="sqa-block sqa-block--blue">
            <div class="sqa-block-header"><span class="sqa-block-title">Age Profile</span><span class="sqa-block-icon">📅</span></div>
            <div class="sqa-age-hero">
                <div class="sqa-age-stat"><span class="sqa-age-val">${avgAge}</span><span class="sqa-age-label">Avg Age</span></div>
                <div class="sqa-age-stat"><span class="sqa-age-val" style="color:#a78bfa">${youngGems.length}</span><span class="sqa-age-label">Young Gems</span></div>
                <div class="sqa-age-stat"><span class="sqa-age-val" style="color:#f59e0b">${veterans.length}</span><span class="sqa-age-label">Veterans</span></div>
            </div>
            <div class="sqa-age-bands">
                <div class="sqa-age-band-track">
                    <div class="sqa-age-band-fill" style="width:${u21/tot*100}%;background:#a78bfa"></div>
                    <div class="sqa-age-band-fill" style="width:${b2126/tot*100}%;background:#22c55e"></div>
                    <div class="sqa-age-band-fill" style="width:${b2731/tot*100}%;background:#60a5fa"></div>
                    <div class="sqa-age-band-fill" style="width:${over32/tot*100}%;background:#f59e0b"></div>
                </div>
                <div class="sqa-age-band-legend">
                    <span><span class="sqa-band-dot" style="background:#a78bfa"></span> ≤21 <b>${u21}</b></span>
                    <span><span class="sqa-band-dot" style="background:#22c55e"></span> 22–26 <b>${b2126}</b></span>
                    <span><span class="sqa-band-dot" style="background:#60a5fa"></span> 27–31 <b>${b2731}</b></span>
                    <span><span class="sqa-band-dot" style="background:#f59e0b"></span> 32+ <b>${over32}</b></span>
                </div>
            </div>
            ${veterans.length ? `<div class="sqa-vet-title">Veterans — manage minutes carefully</div>
            ${veterans.map(p=>`<div class="sqa-player-row">
                <span class="sqa-player-name">${p.name}</span>
                <span class="sqa-player-pos">${p.position}</span>
                <span class="sqa-age-badge">${p.age} yrs</span>
                <span class="sqa-role-tag sqa-role-tag--${(p.role||"").toLowerCase()}">${p.role}</span>
            </div>`).join("")}` : ""}
        </div>

        ${devTargets.length ? `<div class="sqa-block sqa-block--purple">
            <div class="sqa-block-header"><span class="sqa-block-title">Development Targets</span><span class="sqa-block-icon">🌱</span></div>
            <div class="sqa-dev-subtitle">Highest growth ceiling — prioritise their minutes</div>
            ${devTargets.map((p,i) => {
                const gain = p.potential - p.overall;
                const ovrPct = (p.overall - 50) / 50 * 100;
                const gainPct = gain / 50 * 100;
                return `<div class="sqa-dev-card ${i===0?"sqa-dev-card--top":""}">
                    <div class="sqa-dev-top">
                        <div class="sqa-dev-identity">
                            <span class="sqa-player-pos">${p.position}</span>
                            <span class="sqa-dev-name">${p.name}</span>
                            <span class="sqa-dev-age">Age ${p.age}</span>
                        </div>
                        <div class="sqa-dev-nums">
                            <span class="sqa-dev-ovr">${p.overall}</span>
                            <span class="sqa-dev-arrow">→</span>
                            <span class="sqa-dev-pot">${p.potential}</span>
                            <span class="sqa-gain-badge">+${gain}</span>
                        </div>
                    </div>
                    <div class="sqa-growth-track">
                        <div class="sqa-growth-base" style="width:${ovrPct}%"></div>
                        <div class="sqa-growth-gain" style="width:${gainPct}%;left:${ovrPct}%"></div>
                    </div>
                </div>`;
            }).join("")}
        </div>` : ""}

        <div class="sqa-block sqa-block--white">
            <div class="sqa-block-header"><span class="sqa-block-title">Role Balance</span><span class="sqa-block-icon">⚖️</span></div>
            <div class="sqa-role-strip">
                ${Object.entries(roleCounts).map(([role,count]) => {
                    const pct = Math.round(count/roleTotal*100);
                    return `<div class="sqa-role-block" style="--rc:${roleStyle[role]}">
                        <div class="sqa-role-num">${count}</div>
                        <div class="sqa-role-name">${role}</div>
                        <div class="sqa-role-bar"><div class="sqa-role-bar-fill" style="width:${pct}%"></div></div>
                    </div>`;
                }).join("")}
            </div>
            <div class="sqa-role-advice">
                ${roleCounts.Crucial < 3 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ Few Crucial players — consider promoting key performers.</div>` : ""}
                ${roleCounts.Prospect > 6 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ High number of Prospects — loan some out for regular football.</div>` : ""}
                ${roleCounts.Rotation < 4 ? `<div class="sqa-advice-item sqa-advice-item--warn">⚠ Limited rotation options — depth may be stretched over a long season.</div>` : ""}
                ${roleCounts.Crucial >= 5 && roleCounts.Important >= 5 ? `<div class="sqa-advice-item sqa-advice-item--ok">✓ Strong core of key players — well-balanced squad.</div>` : ""}
            </div>
        </div>
    </div>`;
}

// ── Upcoming Match Advice ─────────────────────────────────────

function buildMatchAdvice(players, matches) {
    const next = matches.find(m => !m.result);
    if (!next) return aia_empty("No upcoming matches found.");

    const playedMatches = matches.filter(m => m.result);
    const recentForm = playedMatches.slice(-5);
    const wins = recentForm.filter(m => m.result === "W").length;
    const losses = recentForm.filter(m => m.result === "L").length;
    const formStr = recentForm.map(m => m.result).join(" ");

    const compLabel = { laliga: "La Liga", ucl: "Champions League", copa: "Copa del Rey", supercopa: "Supercopa" }[next.competition] || next.competition;

    const topScorer = [...players].sort((a,b) => (b.goals||0)-(a.goals||0))[0];
    const topRated  = [...players].filter(p=>!p.loan).sort((a,b)=>b.overall-a.overall).slice(0,3);

    const advice = [];
    if (next.venue === "Away") advice.push({ type: "warn", text: "Away fixture — consider a more defensive setup. Prioritise not conceding early." });
    else advice.push({ type: "ok", text: "Home fixture — use the crowd advantage. Press high and be aggressive early." });
    if (losses >= 2) advice.push({ type: "warn", text: "Two losses in last 5 — squad confidence may be low. Stick with your best XI." });
    if (wins >= 4) advice.push({ type: "ok", text: "Excellent recent form. Keep the same setup — don't change what's working." });

    const compIcon = { laliga: "🇪🇸", ucl: "⭐", copa: "🏆", supercopa: "🏅" }[next.competition] || "🎮";

    return `<div class="aia-content">
        <div class="aia-match-banner">
            <div class="aia-match-comp">${compIcon} ${compLabel}</div>
            <div class="aia-match-fixture">
                <span class="aia-match-team">Real Madrid</span>
                <span class="aia-match-vs">${next.venue === "Home" ? "vs" : "@"}</span>
                <span class="aia-match-team">${next.opponent}</span>
            </div>
            <div class="aia-match-date">${next.date} · ${next.venue}</div>
        </div>

        <div class="aia-block">
            <div class="aia-block-title">📊 Recent Form</div>
            <div class="aia-form-row">
                ${recentForm.map(m => `<span class="aia-form-pill aia-form-${m.result.toLowerCase()}">${m.result}</span>`).join("")}
                <span class="aia-form-label">${wins}W in last ${recentForm.length}</span>
            </div>
        </div>

        <div class="aia-block">
            <div class="aia-block-title">🧠 Match Advice</div>
            ${advice.map(a => `<div class="aia-advice-item aia-advice-${a.type}">${a.text}</div>`).join("")}
        </div>

        <div class="aia-block">
            <div class="aia-block-title">⭐ Key Players to Start</div>
            ${topRated.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-ovr">${p.overall}</span>
            </div>`).join("")}
        </div>

        ${topScorer ? `<div class="aia-block">
            <div class="aia-block-title">🎯 Goal Threat</div>
            <div class="aia-player-row">
                <span class="aia-pos-badge">${topScorer.position}</span>
                <span class="aia-player-name">${topScorer.name}</span>
                <span class="aia-player-ovr" style="color:#D4AF37">${topScorer.goals ?? 0} goals</span>
            </div>
        </div>` : ""}
    </div>`;
}

// ── Transfer Advice ───────────────────────────────────────────

function buildTransferAdvice(scoutReport) {
    if (!scoutReport) return aia_empty("No scout report data available.");
    const s = scoutReport;

    const transferSection = s.sections?.find(sec => sec.type === "transfer");
    const shortlist = s.scouting_arena?.shortlist ?? [];

    return `<div class="aia-content">
        ${transferSection ? `<div class="aia-block">
            <div class="aia-block-title">📋 Transfer Priority: <span style="color:${transferSection.priority==="LOW"?"#22c55e":"#ef4444"}">${transferSection.priority}</span></div>
            <ul class="aia-list">
                ${transferSection.points.map(p=>`<li>${p}</li>`).join("")}
            </ul>
            ${transferSection.note ? `<div class="aia-note">${transferSection.note}</div>` : ""}
        </div>` : ""}

        <div class="aia-block">
            <div class="aia-block-title">🎯 Shortlist Targets</div>
            ${shortlist.map(p => `<div class="aia-transfer-row">
                <div class="aia-transfer-left">
                    <span class="aia-pos-badge">${p.position}</span>
                    <div>
                        <div class="aia-player-name">${p.name}</div>
                        <div class="aia-player-club">${p.club} · ${p.value}</div>
                    </div>
                </div>
                <div class="aia-transfer-right">
                    <span class="aia-ovr-pair">${p.ovr} <span style="color:#a78bfa">${p.pot}</span></span>
                    <span class="aia-feas-dot aia-feas-${p.feasibility_dot}"></span>
                </div>
            </div>`).join("")}
        </div>
    </div>`;
}

// ── Contract Advice ───────────────────────────────────────────

function buildContractAdvice(players) {
    const active = players.filter(p => !p.loan);
    const crucial = active.filter(p => p.role === "Crucial").sort((a,b) => b.age - a.age);
    const agingKey = active.filter(p => p.age >= 30 && (p.role === "Crucial" || p.role === "Important"));
    const youngToTie = active.filter(p => p.age <= 23 && p.potential >= 80 && p.role !== "Prospect");
    const letGo = active.filter(p => p.age >= 33 && p.role === "Rotation");

    const item = (text, type) => `<div class="aia-advice-item aia-advice-${type}">${text}</div>`;

    return `<div class="aia-content">
        ${agingKey.length ? `<div class="aia-block">
            <div class="aia-block-title">⚠️ Ageing Key Players — Prioritise Renewal</div>
            ${agingKey.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta">Age ${p.age} · ${p.role}</span>
            </div>`).join("")}
            ${item("Renew contracts before they enter their final year — leverage is lost once they can negotiate freely.", "warn")}
        </div>` : ""}

        ${youngToTie.length ? `<div class="aia-block">
            <div class="aia-block-title">🌟 Tie Down Young Talent</div>
            ${youngToTie.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta">Age ${p.age} · POT ${p.potential}</span>
            </div>`).join("")}
            ${item("Long-term contracts protect resale value and deter rival clubs from approaching.", "ok")}
        </div>` : ""}

        ${letGo.length ? `<div class="aia-block">
            <div class="aia-block-title">📤 Consider Not Renewing</div>
            ${letGo.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta" style="color:#ef4444">Age ${p.age} · ${p.overall} OVR</span>
            </div>`).join("")}
            ${item("Rotation players aged 33+ will cost wages without meaningful contribution. Free the wage budget.", "warn")}
        </div>` : ""}

        ${!agingKey.length && !youngToTie.length && !letGo.length
            ? `<div class="aia-block">${item("✓ Squad contract situation looks stable. No immediate action required.", "ok")}</div>`
            : ""}
    </div>`;
}

// ── Youth / Loan Advice ───────────────────────────────────────

function buildYouthAdvice(players) {
    const loaned = players.filter(p => p.loan);
    const prospects = players.filter(p => !p.loan && p.role === "Prospect");
    const highPot = players.filter(p => !p.loan && p.age <= 21 && p.potential >= 78)
        .sort((a,b) => b.potential - a.potential);

    const item = (text, type) => `<div class="aia-advice-item aia-advice-${type}">${text}</div>`;

    return `<div class="aia-content">
        ${loaned.length ? `<div class="aia-block">
            <div class="aia-block-title">🔁 Out on Loan (${loaned.length})</div>
            ${loaned.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta">Age ${p.age} · POT ${p.potential}${p.loanClub ? ` · ${p.loanClub}` : ""}</span>
            </div>`).join("")}
            ${item("Check loan performance reports before the January window. Consider recalling if a position becomes short.", "warn")}
        </div>` : ""}

        ${highPot.length ? `<div class="aia-block">
            <div class="aia-block-title">🌱 High-Potential Youth (≤21)</div>
            ${highPot.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta">Age ${p.age} · ${p.overall} OVR → <span style="color:#a78bfa">${p.potential} POT</span></span>
            </div>`).join("")}
            ${item("Prioritise minutes in cup competitions. Development stalls without regular match time.", "ok")}
        </div>` : ""}

        ${prospects.length ? `<div class="aia-block">
            <div class="aia-block-title">👀 Squad Prospects — Needs Decision</div>
            ${prospects.map(p => `<div class="aia-player-row">
                <span class="aia-pos-badge">${p.position}</span>
                <span class="aia-player-name">${p.name}</span>
                <span class="aia-player-meta">Age ${p.age} · POT ${p.potential}</span>
            </div>`).join("")}
            ${item("Players sitting unused lose development. Either integrate them or send them on loan.", "warn")}
        </div>` : ""}
    </div>`;
}

// ── Tactical Suggestions ──────────────────────────────────────

function buildTacticalAdvice(matches, scoutReport) {
    const played = matches.filter(m => m.result);
    const wins = played.filter(m => m.result === "W").length;
    const losses = played.filter(m => m.result === "L").length;
    const draws = played.filter(m => m.result === "D").length;
    const goalsFor = played.reduce((s,m) => s + (m.scoreFor||0), 0);
    const goalsAgainst = played.reduce((s,m) => s + (m.scoreAgainst||0), 0);

    const tacticalSection = scoutReport?.sections?.find(s => s.type === "tactical");
    const item = (text, type) => `<div class="aia-advice-item aia-advice-${type}">${text}</div>`;

    const suggestions = [];
    if (goalsAgainst / (played.length||1) > 1.5) suggestions.push({ type:"warn", text:"Conceding more than 1.5 per game — consider dropping deeper and prioritising defensive solidity." });
    if (goalsFor / (played.length||1) > 2.5) suggestions.push({ type:"ok", text:"Averaging over 2.5 goals per game — attacking shape is working. Maintain pressing intensity." });
    if (losses >= 2) suggestions.push({ type:"warn", text:"Multiple defeats — review opponent scouting. Adjust in-game when the press isn't working." });
    if (wins / (played.length||1) >= 0.7) suggestions.push({ type:"ok", text:"Win rate above 70% — tactical consistency is paying off. Avoid unnecessary changes." });

    return `<div class="aia-content">
        <div class="aia-block">
            <div class="aia-block-title">📊 Season Overview</div>
            <div class="aia-stats-row">
                <div class="aia-stat"><div class="aia-stat-val" style="color:#22c55e">${wins}</div><div class="aia-stat-lbl">W</div></div>
                <div class="aia-stat"><div class="aia-stat-val" style="color:#94a3b8">${draws}</div><div class="aia-stat-lbl">D</div></div>
                <div class="aia-stat"><div class="aia-stat-val" style="color:#ef4444">${losses}</div><div class="aia-stat-lbl">L</div></div>
                <div class="aia-stat"><div class="aia-stat-val">${goalsFor}</div><div class="aia-stat-lbl">GF</div></div>
                <div class="aia-stat"><div class="aia-stat-val">${goalsAgainst}</div><div class="aia-stat-lbl">GA</div></div>
            </div>
        </div>

        ${suggestions.length ? `<div class="aia-block">
            <div class="aia-block-title">💡 Tactical Insights</div>
            ${suggestions.map(s => item(s.text, s.type)).join("")}
        </div>` : ""}

        ${tacticalSection ? `<div class="aia-block">
            <div class="aia-block-title">🧠 Scout Verdict</div>
            <p class="aia-body">${tacticalSection.content}</p>
        </div>` : ""}
    </div>`;
}

// ── Helpers ───────────────────────────────────────────────────

function aia_empty(msg) {
    return `<div class="aia-content"><p class="aia-body" style="opacity:.5">${msg}</p></div>`;
}

function buildTab(tab, players, matches, scoutReport) {
    switch (tab) {
        case "squad":    return buildSquadAdvice(players);
        case "match":    return buildMatchAdvice(players, matches);
        case "transfer": return buildTransferAdvice(scoutReport);
        case "contract": return buildContractAdvice(players);
        case "youth":    return buildYouthAdvice(players);
        case "tactical": return buildTacticalAdvice(matches, scoutReport);
        default:         return aia_empty("Coming soon.");
    }
}

// ── Public ────────────────────────────────────────────────────

export async function renderAIAssistant(players, matches) {
    const scoutReport = await fetch(`data/scout-report.json?v=${Date.now()}`).then(r => r.json()).catch(() => null);

    return `<section class="aia-wrap">
        ${tabBar()}
        <div id="aia-body">${buildTab(_activeTab, players, matches, scoutReport)}</div>
    </section>`;
}

export function initializeAIAssistant(players, matches) {
    fetch(`data/scout-report.json?v=${Date.now()}`).then(r => r.json()).catch(() => null).then(scoutReport => {
        document.getElementById("aia-tabs")?.addEventListener("click", e => {
            const btn = e.target.closest(".aia-tab");
            if (!btn) return;
            _activeTab = btn.dataset.tab;
            document.querySelectorAll(".aia-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === _activeTab));
            document.getElementById("aia-body").innerHTML = buildTab(_activeTab, players, matches, scoutReport);
        });
    });
}
