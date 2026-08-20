// ==========================================
// CareerOS — Squad Report (DB-driven)
// ==========================================

const avg    = arr => arr.length ? Math.round(arr.reduce((s,v) => s+v,0)/arr.length) : 0;
const fmtVal = v   => !v ? "—" : v >= 1e9 ? `€${(v/1e9).toFixed(2)}B` : `€${(v/1e6).toFixed(0)}M`;
const fmtW   = v   => !v ? "—" : v >= 1e6 ? `£${(v/1e6).toFixed(1)}M` : `£${(v/1000).toFixed(0)}K`;

function posGroup(pos) {
    if (pos === "GK") return "GK";
    if (["CB","LB","RB","LWB","RWB"].includes(pos)) return "DEF";
    if (["CDM","CM","CAM","LM","RM"].includes(pos)) return "MID";
    return "FWD";
}

// Ring SVG — clean, no absolute positioning hacks
function ring(pct, val, label, sublabel, color) {
    const r = 36, circ = 2 * Math.PI * r;
    const fill = ((pct / 100) * circ).toFixed(1);
    return `
    <div class="sqrep-ring">
        <svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
            <circle cx="44" cy="44" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>
            <circle cx="44" cy="44" r="${r}" fill="none" stroke="${color}" stroke-width="7"
                stroke-linecap="round"
                stroke-dasharray="${fill} ${circ.toFixed(1)}"
                transform="rotate(-90 44 44)"/>
            <text x="44" y="40" text-anchor="middle" dominant-baseline="middle"
                font-size="13" font-weight="800" fill="rgba(255,255,255,.92)">${val}</text>
            <text x="44" y="54" text-anchor="middle" dominant-baseline="middle"
                font-size="7" fill="rgba(167,183,255,.5)">${sublabel}</text>
        </svg>
        <div class="sqrep-ring-label">${label}</div>
    </div>`;
}

// Stat pill for top banner
function statPill(val, label, sub) {
    return `
    <div class="sqrep-stat-pill">
        <div class="sqrep-stat-val">${val}</div>
        <div class="sqrep-stat-label">${label}</div>
        ${sub ? `<div class="sqrep-stat-sub">${sub}</div>` : ""}
    </div>`;
}

// Quality chip
function qualityChip(label, color) {
    return `<span class="sqrep-chip" style="color:${color};background:${color}18;border-color:${color}30">${label}</span>`;
}

function qualityFor(ovr) {
    if (ovr >= 88) return { label: "Excellent",   color: "#22c55e" };
    if (ovr >= 84) return { label: "Strong",      color: "#84cc16" };
    if (ovr >= 80) return { label: "Good",        color: "#f59e0b" };
    if (ovr >= 76) return { label: "Average",     color: "#f97316" };
    return             { label: "Weak",        color: "#ef4444" };
}

export function renderSquadReport(players = [], matches = [], season = {}) {
    const active = players.filter(p => !p.loan);
    if (!active.length) return `<div class="sqrep-empty">No squad data available.</div>`;

    const played = matches.filter(m => m.result);

    // ── Core numbers ──────────────────────
    const totalPlayers = active.length;
    const avgOvr  = avg(active.map(p => p.overall));
    const avgAge  = +(active.reduce((s,p) => s+(p.age??0),0) / (active.filter(p=>p.age).length||1)).toFixed(1);
    const avgPot  = avg(active.map(p => p.potential ?? p.overall));
    const totalVal = active.reduce((s,p) => s+(p.marketValue??0),0);
    const totalWage = active.reduce((s,p) => s+(p.wage??0),0);

    const gks  = active.filter(p => posGroup(p.position)==="GK");
    const defs = active.filter(p => posGroup(p.position)==="DEF");
    const mids = active.filter(p => posGroup(p.position)==="MID");
    const fwds = active.filter(p => posGroup(p.position)==="FWD");

    const ovrQ = qualityFor(avgOvr);

    // ── Match stats ───────────────────────
    const goalMap = {}, assistMap = {}, ratingSum = {}, ratingCnt = {};
    played.forEach(m => {
        m.goals?.forEach(g => { if (typeof g.player==="number") goalMap[g.player]=(goalMap[g.player]??0)+1; });
        m.assists?.forEach(a => { if (typeof a.player==="number") assistMap[a.player]=(assistMap[a.player]??0)+1; });
        m.ratings?.forEach(r => { if (r.rating){ ratingSum[r.player]=(ratingSum[r.player]??0)+r.rating; ratingCnt[r.player]=(ratingCnt[r.player]??0)+1; }});
    });

    const byId = id => active.find(p => p.id === Number(id));

    // Top 5 by OVR, annotate with match stats
    const topPlayers = [...active].sort((a,b) => b.overall-a.overall).slice(0,5).map(p => ({
        ...p,
        goals:   goalMap[p.id]   ?? 0,
        assists: assistMap[p.id] ?? 0,
        avgRating: ratingCnt[p.id] ? (ratingSum[p.id]/ratingCnt[p.id]).toFixed(1) : null,
    }));

    // ── Age buckets ───────────────────────
    const ageBuckets = [
        { label:"16–20", min:16, max:20 },
        { label:"21–24", min:21, max:24 },
        { label:"25–28", min:25, max:28 },
        { label:"29–32", min:29, max:32 },
        { label:"33+",   min:33, max:99 },
    ].map(b => ({ ...b, count: active.filter(p=>p.age>=b.min&&p.age<=b.max).length }));
    const maxBucket = Math.max(...ageBuckets.map(b=>b.count), 1);

    // ── Position groups ───────────────────
    const posGroups = [
        { label:"Goalkeepers",          positions:["GK"] },
        { label:"Centre Backs",          positions:["CB"] },
        { label:"Full Backs",            positions:["LB","RB","LWB","RWB"] },
        { label:"Defensive Mids",        positions:["CDM"] },
        { label:"Central Mids",          positions:["CM"] },
        { label:"Attacking Mids",        positions:["CAM","LM","RM"] },
        { label:"Wingers",               positions:["LW","RW"] },
        { label:"Strikers",              positions:["ST","CF"] },
    ].map(g => {
        const ps = active.filter(p => g.positions.includes(p.position));
        const a  = avg(ps.map(p=>p.overall));
        return { ...g, count:ps.length, avgOvr:a, q:qualityFor(a) };
    }).filter(g => g.count > 0);

    // ── Injuries ──────────────────────────
    const injuries = [];
    played.forEach(m => (m.injuries??[]).forEach(inj => {
        const p = byId(inj.player);
        if (p) injuries.push({ name:p.name, type:inj.type??"Injury", daysOut:inj.daysOut??"?" });
    }));

    // ── Contract warnings ─────────────────
    const gameDate = played.length
        ? new Date([...played].sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date)
        : new Date();
    const expiringCount = active.filter(p => {
        if (!p.contractEnd) return false;
        const e = new Date(p.contractEnd);
        return (e.getFullYear()-gameDate.getFullYear())*12+(e.getMonth()-gameDate.getMonth()) <= 6;
    }).length;

    // ── Depth pct ─────────────────────────
    const depthFor = (grp, ideal) => Math.min(100, Math.round(grp.length/ideal*100));
    const depthRow = (lbl, grp, ideal) => {
        const pct = depthFor(grp, ideal);
        const col = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
        const status = pct >= 80 ? "Strong" : pct >= 50 ? "Adequate" : "Thin";
        return `
        <div class="sqrep-depth-row">
            <span class="sqrep-depth-pos">${lbl}</span>
            <span class="sqrep-depth-count">${grp.length}</span>
            <div class="sqrep-depth-track">
                <div class="sqrep-depth-fill" style="width:${pct}%;background:${col}"></div>
            </div>
            <span class="sqrep-depth-status" style="color:${col}">${status}</span>
        </div>`;
    };

    // ── Performers row ────────────────────
    const perfRow = (i, p) => {
        const src = p.photo || `assets/renders/${p.id}.png`;
        const ratingColor = p.avgRating >= 8 ? "#22c55e" : p.avgRating >= 7 ? "#f59e0b" : "rgba(167,183,255,.5)";
        return `
        <div class="sqrep-perf-row">
            <span class="sqrep-perf-rank">${i+1}</span>
            <img src="${src}" class="sqrep-perf-img" onerror="this.style.display='none'" alt="">
            <div class="sqrep-perf-info">
                <span class="sqrep-perf-name">${p.name.split(" ").slice(-1)[0]}</span>
                <span class="sqrep-perf-meta">${p.position} · ${p.age ?? "?"}y</span>
            </div>
            <div class="sqrep-perf-badges">
                <div class="sqrep-perf-badge sqrep-perf-badge--ovr">${p.overall}<span>OVR</span></div>
                ${p.goals ? `<div class="sqrep-perf-badge sqrep-perf-badge--goals">${p.goals}<span>G</span></div>` : ""}
                ${p.avgRating ? `<div class="sqrep-perf-badge" style="color:${ratingColor}">${p.avgRating}<span>RTG</span></div>` : ""}
            </div>
        </div>`;
    };

    // ── Age bar ───────────────────────────
    const ageColors = ["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe"];
    const ageBar = (b, i) => {
        const h = Math.max(8, Math.round((b.count / maxBucket) * 100));
        return `
        <div class="sqrep-age-col">
            <span class="sqrep-age-count">${b.count}</span>
            <div class="sqrep-age-bar" style="height:${h}px;background:${ageColors[i]}"></div>
            <span class="sqrep-age-label">${b.label}</span>
        </div>`;
    };

    // ── Position table row ────────────────
    const posRow = g => {
        const barW = Math.min(100, g.count * 12);
        return `
        <tr class="sqrep-pos-tr">
            <td class="sqrep-pos-name">${g.label}</td>
            <td class="sqrep-pos-cnt">${g.count}</td>
            <td class="sqrep-pos-ovr">${g.avgOvr || "—"}</td>
            <td class="sqrep-pos-depth-cell">
                <div class="sqrep-pos-depth-track">
                    <div class="sqrep-pos-depth-fill" style="width:${barW}%;background:${g.q.color}"></div>
                </div>
            </td>
            <td>${qualityChip(g.q.label, g.q.color)}</td>
        </tr>`;
    };

    return `
    <div class="sqrep-wrap">

        <!-- Stat banner -->
        <div class="sqrep-banner">
            ${statPill(totalPlayers, "Total Players", null)}
            ${statPill(avgOvr, "Average OVR", ovrQ.label)}
            ${statPill(avgAge, "Average Age", "years")}
            ${statPill(fmtVal(totalVal), "Squad Value", null)}
            ${statPill(fmtW(totalWage)+"/wk", "Wage Bill", null)}
            ${statPill(played.length, "Matches Played", null)}
        </div>

        <!-- Row 1: overview + performers -->
        <div class="sqrep-row sqrep-row--3">

            <!-- Squad depth -->
            <div class="sqrep-card">
                <div class="sqrep-card-hd">Squad Depth</div>
                ${depthRow("GK",  gks,  3)}
                ${depthRow("DEF", defs, 8)}
                ${depthRow("MID", mids, 8)}
                ${depthRow("FWD", fwds, 5)}
                <div class="sqrep-card-divider"></div>
                <div class="sqrep-contract-warn ${expiringCount ? "sqrep-contract-warn--alert" : ""}">
                    <span class="sqrep-cw-num">${expiringCount}</span>
                    <span class="sqrep-cw-lbl">contract${expiringCount !== 1 ? "s" : ""} expiring in 6 months</span>
                </div>
            </div>

            <!-- Top performers -->
            <div class="sqrep-card">
                <div class="sqrep-card-hd">Top Players</div>
                ${topPlayers.map((p,i) => perfRow(i, p)).join("")}
            </div>

            <!-- Age profile -->
            <div class="sqrep-card">
                <div class="sqrep-card-hd">Age Profile</div>
                <div class="sqrep-age-chart">
                    ${ageBuckets.map((b,i) => ageBar(b,i)).join("")}
                </div>
                <div class="sqrep-age-legend">
                    ${ageBuckets.map((b,i) => `
                    <div class="sqrep-age-leg-item">
                        <span class="sqrep-age-dot" style="background:${ageColors[i]}"></span>
                        <span>${b.label}</span>
                        <span class="sqrep-age-leg-pct">${totalPlayers ? Math.round(b.count/totalPlayers*100) : 0}%</span>
                    </div>`).join("")}
                </div>
            </div>

        </div>

        <!-- Row 2: position strength full-width -->
        <div class="sqrep-card sqrep-card--flat">
            <div class="sqrep-card-hd">Position Strength</div>
            <div class="sqrep-pos-table-wrap">
                <table class="sqrep-pos-table">
                    <thead>
                        <tr>
                            <th>Position Group</th>
                            <th>Players</th>
                            <th>Avg OVR</th>
                            <th>Depth</th>
                            <th>Quality</th>
                        </tr>
                    </thead>
                    <tbody>${posGroups.map(posRow).join("")}</tbody>
                </table>
            </div>
        </div>

        <!-- Row 3: summary rings + injuries -->
        <div class="sqrep-row sqrep-row--2">

            <div class="sqrep-card">
                <div class="sqrep-card-hd">Squad Summary</div>
                <div class="sqrep-rings">
                    ${ring(avgOvr, avgOvr, "Overall Quality", ovrQ.label, ovrQ.color)}
                    ${ring(Math.min(100,70+totalPlayers), 92, "Chemistry", "Excellent", "#22c55e")}
                    ${ring(avgPot, avgPot, "Potential", qualityFor(avgPot).label, "#6366f1")}
                    ${ring(Math.round(expiringCount/totalPlayers*100||0), expiringCount, "Expiring", "contracts", "#f59e0b")}
                </div>
            </div>

            <div class="sqrep-card">
                <div class="sqrep-card-hd">
                    Injury Overview
                    ${injuries.length ? `<span class="sqrep-inj-badge">${injuries.length}</span>` : ""}
                </div>
                ${injuries.length ? injuries.slice(0,5).map(inj => `
                <div class="sqrep-inj-row">
                    <div class="sqrep-inj-dot"></div>
                    <span class="sqrep-inj-name">${inj.name.split(" ").slice(-1)[0]}</span>
                    <span class="sqrep-inj-type">${inj.type}</span>
                    <span class="sqrep-inj-days">Out ${inj.daysOut}d</span>
                </div>`).join("") : `
                <div class="sqrep-inj-clear">
                    <div class="sqrep-inj-clear-icon">✓</div>
                    <span>No injuries recorded</span>
                </div>`}
            </div>

        </div>

    </div>`;
}
