// ==========================================
// CareerOS — Analytics
// ==========================================

let _matches = [];
let _players = [];
let _activePlayer    = null;
let _activePlayerChart = "rating";
let _activeTeamChart   = "goals";

// SVG canvas constants
const W = 360, H = 148;
const P = { t: 14, r: 12, b: 30, l: 34 };
const CW = W - P.l - P.r;
const CH = H - P.t - P.b;

// ── Public API ──────────────────────────────────────────────────────────

export function renderAnalytics(matches = [], players = []) {
    _matches = matches;
    _players = players;

    const played = matches.filter(m => m.result);
    const playerList = buildPlayerList(played, players);

    if (!_activePlayer || !playerList.find(p => p.id === _activePlayer))
        _activePlayer = playerList[0]?.id ?? null;

    if (!played.length) return `
        <section class="an-page fade">
            <div class="page-header"><h1>Analytics</h1><p>Season 2027/28</p></div>
            <div class="an-empty">No match data available yet.</div>
        </section>`;

    return `
    <section class="an-page fade">
        <div class="page-header">
            <h1>Analytics</h1>
            <p>2027/28 · ${played.length} matches played</p>
        </div>

        <div class="an-block">
            <div class="an-block-header">
                <span class="an-block-title">Player</span>
                <select class="an-player-select" id="an-player-select">
                    ${playerList.map(p =>
                        `<option value="${p.id}"${p.id === _activePlayer ? " selected" : ""}>${p.name}</option>`
                    ).join("")}
                </select>
            </div>
            <div class="an-tabs" id="an-player-tabs">
                ${tabs([
                    { k: "rating",        l: "Rating Trend" },
                    { k: "contributions", l: "Contributions" },
                    { k: "minutes",       l: "Minutes" },
                    { k: "top-rated",     l: "Top Ratings" },
                ], _activePlayerChart)}
            </div>
            <div class="an-chart" id="an-player-chart">
                ${renderPlayerChart(_activePlayerChart, _activePlayer, played)}
            </div>
        </div>

        <div class="an-block">
            <div class="an-block-header">
                <span class="an-block-title">Team</span>
            </div>
            <div class="an-tabs" id="an-team-tabs">
                ${tabs([
                    { k: "goals",      l: "Goals" },
                    { k: "possession", l: "Possession" },
                    { k: "form",       l: "Form" },
                ], _activeTeamChart)}
            </div>
            <div class="an-chart" id="an-team-chart">
                ${renderTeamChart(_activeTeamChart, played)}
            </div>
        </div>
    </section>`;
}

export function initializeAnalytics() {
    document.getElementById("an-player-select")?.addEventListener("change", e => {
        _activePlayer = Number(e.target.value);
        refreshPlayerChart();
    });

    document.getElementById("an-player-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".an-tab");
        if (!btn) return;
        _activePlayerChart = btn.dataset.chart;
        document.querySelectorAll("#an-player-tabs .an-tab").forEach(b => b.classList.toggle("active", b === btn));
        refreshPlayerChart();
    });

    document.getElementById("an-team-tabs")?.addEventListener("click", e => {
        const btn = e.target.closest(".an-tab");
        if (!btn) return;
        _activeTeamChart = btn.dataset.chart;
        document.querySelectorAll("#an-team-tabs .an-tab").forEach(b => b.classList.toggle("active", b === btn));
        document.getElementById("an-team-chart").innerHTML =
            renderTeamChart(_activeTeamChart, _matches.filter(m => m.result));
    });
}

function refreshPlayerChart() {
    document.getElementById("an-player-chart").innerHTML =
        renderPlayerChart(_activePlayerChart, _activePlayer, _matches.filter(m => m.result));
}

// ── Player charts ───────────────────────────────────────────────────────

function renderPlayerChart(type, pid, played) {
    if (!pid) return noData();
    switch (type) {
        case "rating":        return chartRatingTrend(pid, played);
        case "contributions": return chartContributions(pid, played);
        case "minutes":       return chartMinutes(pid, played);
        case "top-rated":     return chartTopRated(played);
        default: return noData();
    }
}

function chartRatingTrend(pid, played) {
    const data = played.map(m => ({
        label: shortOpp(m.opponent),
        value: m.performances?.find(p => p.player === pid)?.rating ?? null,
    }));
    if (!data.some(d => d.value !== null)) return noData("Player hasn't appeared in any matches yet");
    return lineChart(data, { minY: 5, maxY: 10, color: "#d4af37", gridLines: [6, 7, 8, 9, 10] });
}

function chartContributions(pid, played) {
    const data = played.map(m => ({
        label: shortOpp(m.opponent),
        goals:   m.goals?.filter(g => g.player === pid).length ?? 0,
        assists: m.assists?.filter(a => a.player === pid).reduce((s, a) => s + (a.count ?? 1), 0) ?? 0,
    }));
    if (!data.some(d => d.goals > 0 || d.assists > 0)) return noData("No goals or assists recorded");
    const maxVal = Math.max(...data.map(d => d.goals + d.assists), 1);
    return stackedBarChart(data, maxVal);
}

function chartMinutes(pid, played) {
    const data = played.map(m => ({
        label:   shortOpp(m.opponent),
        value:   getMinutes(pid, m),
        started: m.startingXI?.includes(pid) ?? false,
    }));
    if (!data.some(d => d.value > 0)) return noData("No appearances recorded");
    return minutesBarChart(data);
}

function chartTopRated(played) {
    const rMap = {};
    played.forEach(m => {
        m.performances?.forEach(p => {
            if (typeof p.player !== "number") return;
            if (!rMap[p.player]) rMap[p.player] = [];
            rMap[p.player].push(p.rating);
        });
    });
    const rows = Object.entries(rMap)
        .map(([id, rs]) => ({
            name: _players.find(p => p.id === Number(id))?.name ?? `#${id}`,
            avg: rs.reduce((s, r) => s + r, 0) / rs.length,
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 8);
    return hBarChart(rows);
}

// ── Team charts ─────────────────────────────────────────────────────────

function renderTeamChart(type, played) {
    switch (type) {
        case "goals":      return chartTeamGoals(played);
        case "possession": return chartPossession(played);
        case "form":       return chartForm(played);
        default: return noData();
    }
}

function chartTeamGoals(played) {
    const data = played.map(m => ({
        label:    shortOpp(m.opponent),
        scored:   m.scoreFor ?? 0,
        conceded: m.scoreAgainst ?? 0,
    }));
    const maxVal = Math.max(...data.map(d => Math.max(d.scored, d.conceded)), 1);
    return goalsBarChart(data, maxVal);
}

function chartPossession(played) {
    const data = played
        .filter(m => m.teamStats?.possession != null)
        .map(m => ({ label: shortOpp(m.opponent), value: m.teamStats.possession }));
    if (!data.length) return noData("No possession data recorded");
    return lineChart(data, { minY: 30, maxY: 70, color: "#60a5fa", gridLines: [30, 40, 50, 60, 70], refLine: 50 });
}

function chartForm(played) {
    let cum = 0;
    const data = played.map(m => {
        cum += m.result === "W" ? 3 : m.result === "D" ? 1 : 0;
        return { label: shortOpp(m.opponent), value: cum, result: m.result };
    });
    return formChart(data);
}

// ── SVG renderers ───────────────────────────────────────────────────────

function lineChart(data, { minY, maxY, color, gridLines = [], refLine = null }) {
    const n = data.length;
    const xOf = i => P.l + (n > 1 ? i * (CW / (n - 1)) : CW / 2);
    const yOf = v => P.t + CH - ((v - minY) / (maxY - minY)) * CH;

    let segs = [], cur = [];
    data.forEach((d, i) => {
        if (d.value !== null) cur.push(`${cur.length ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`);
        else { if (cur.length) segs.push(cur.join(" ")); cur = []; }
    });
    if (cur.length) segs.push(cur.join(" "));

    const filled = data.filter(d => d.value !== null);
    const bot = P.t + CH;
    const areaPath = filled.length >= 2
        ? `M${xOf(data.indexOf(filled[0])).toFixed(1)},${yOf(filled[0].value).toFixed(1)} `
          + filled.slice(1).map(d => `L${xOf(data.indexOf(d)).toFixed(1)},${yOf(d.value).toFixed(1)}`).join(" ")
          + ` L${xOf(data.indexOf(filled[filled.length-1])).toFixed(1)},${bot} L${xOf(data.indexOf(filled[0])).toFixed(1)},${bot} Z`
        : "";

    const uid = color.replace("#", "");
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        <defs><linearGradient id="lg${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity=".2"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient></defs>
        ${gridLines.map(v => {
            const y = yOf(v).toFixed(1);
            return `<line x1="${P.l}" y1="${y}" x2="${W-P.r}" y2="${y}" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
                    <text x="${P.l-4}" y="${(yOf(v)+3).toFixed(1)}" fill="rgba(255,255,255,.3)" font-size="8" text-anchor="end">${v}</text>`;
        }).join("")}
        ${refLine !== null ? `<line x1="${P.l}" y1="${yOf(refLine).toFixed(1)}" x2="${W-P.r}" y2="${yOf(refLine).toFixed(1)}" stroke="rgba(255,255,255,.22)" stroke-width="1" stroke-dasharray="4,3"/>` : ""}
        ${areaPath ? `<path d="${areaPath}" fill="url(#lg${uid})"/>` : ""}
        ${segs.map(d => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`).join("")}
        ${data.map((d, i) => d.value === null ? "" : `
            <circle cx="${xOf(i).toFixed(1)}" cy="${yOf(d.value).toFixed(1)}" r="3.5" fill="${color}"/>
            <text x="${xOf(i).toFixed(1)}" y="${(yOf(d.value)-7).toFixed(1)}" fill="${color}" font-size="8" text-anchor="middle" font-weight="600">${d.value}</text>
        `).join("")}
        ${data.map((d, i) => `<text x="${xOf(i).toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="middle">${d.label}</text>`).join("")}
    </svg>`;
}

function stackedBarChart(data, maxVal) {
    const n = data.length;
    const step = CW / n;
    const bw = Math.min(22, step - 6);
    const yOf = v => (v / maxVal) * CH;

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        <line x1="${P.l}" y1="${P.t+CH}" x2="${W-P.r}" y2="${P.t+CH}" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
        <text x="${P.l-4}" y="${P.t+10}" fill="#4ade80" font-size="8" text-anchor="end">G</text>
        <text x="${P.l-4}" y="${P.t+20}" fill="#d4af37" font-size="8" text-anchor="end">A</text>
        ${data.map((d, i) => {
            const cx = P.l + step * i + step / 2;
            const gh = yOf(d.goals), ah = yOf(d.assists);
            const topY = P.t + CH - gh - ah;
            return `
            ${ah > 0 ? `<rect x="${(cx-bw/2).toFixed(1)}" y="${(P.t+CH-ah).toFixed(1)}" width="${bw}" height="${ah.toFixed(1)}" fill="#d4af37" rx="2"/>` : ""}
            ${gh > 0 ? `<rect x="${(cx-bw/2).toFixed(1)}" y="${topY.toFixed(1)}" width="${bw}" height="${gh.toFixed(1)}" fill="#4ade80" rx="2"/>` : ""}
            ${gh+ah > 0 ? `<text x="${cx.toFixed(1)}" y="${(topY-4).toFixed(1)}" fill="rgba(255,255,255,.7)" font-size="8" text-anchor="middle">${d.goals+d.assists}</text>` : ""}
            <text x="${cx.toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="middle">${d.label}</text>`;
        }).join("")}
    </svg>`;
}

function minutesBarChart(data) {
    const n = data.length;
    const step = CW / n;
    const bw = Math.min(22, step - 6);
    const yOf = v => (v / 90) * CH;

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        ${[30, 60, 90].map(v => {
            const y = (P.t + CH - yOf(v)).toFixed(1);
            return `<line x1="${P.l}" y1="${y}" x2="${W-P.r}" y2="${y}" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
                    <text x="${P.l-4}" y="${(+y+3).toFixed(1)}" fill="rgba(255,255,255,.3)" font-size="8" text-anchor="end">${v}'</text>`;
        }).join("")}
        ${data.map((d, i) => {
            const cx = P.l + step * i + step / 2;
            const h = yOf(d.value);
            const y = P.t + CH - h;
            const col = d.started ? "#d4af37" : "#60a5fa";
            return d.value === 0 ? `<text x="${cx.toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.2)" font-size="8" text-anchor="middle">${d.label}</text>` : `
            <rect x="${(cx-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" fill="${col}" rx="2" opacity=".85"/>
            <text x="${cx.toFixed(1)}" y="${(y-4).toFixed(1)}" fill="${col}" font-size="8" text-anchor="middle">${d.value}'</text>
            <text x="${cx.toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="middle">${d.label}</text>`;
        }).join("")}
        <text x="${P.l}" y="${H-4}" fill="#d4af37" font-size="7">● Start</text>
        <text x="${P.l+42}" y="${H-4}" fill="#60a5fa" font-size="7">● Sub</text>
    </svg>`;
}

function hBarChart(rows) {
    if (!rows.length) return noData();
    const rowH = 20;
    const svgH = rows.length * rowH + 8;
    const nameW = 100;
    const barX = P.l + nameW;
    const barMaxW = W - barX - P.r - 38;

    return `<svg viewBox="0 0 ${W} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        ${rows.map((r, i) => {
            const y = i * rowH + 6;
            const bw = (r.avg / 10) * barMaxW;
            const name = r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name;
            return `
            <text x="${P.l-4}" y="${y+10}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="end">${i+1}</text>
            <text x="${P.l}" y="${y+10}" fill="rgba(255,255,255,.85)" font-size="9">${name}</text>
            <rect x="${barX}" y="${y+1}" width="${bw.toFixed(1)}" height="11" fill="#d4af37" rx="3" opacity=".8"/>
            <text x="${(barX+bw+4).toFixed(1)}" y="${y+10}" fill="#d4af37" font-size="9" font-weight="600">${r.avg.toFixed(2)}</text>`;
        }).join("")}
    </svg>`;
}

function goalsBarChart(data, maxVal) {
    const n = data.length;
    const step = CW / n;
    const bw = Math.min(13, step / 2 - 3);
    const yOf = v => (v / maxVal) * CH;

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        ${[1,2,3,4,5].filter(v => v <= maxVal).map(v => {
            const y = (P.t + CH - yOf(v)).toFixed(1);
            return `<line x1="${P.l}" y1="${y}" x2="${W-P.r}" y2="${y}" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
                    <text x="${P.l-4}" y="${(+y+3).toFixed(1)}" fill="rgba(255,255,255,.3)" font-size="8" text-anchor="end">${v}</text>`;
        }).join("")}
        ${data.map((d, i) => {
            const cx = P.l + step * i + step / 2;
            const sh = yOf(d.scored), ch = yOf(d.conceded);
            return `
            <rect x="${(cx-bw-1).toFixed(1)}" y="${(P.t+CH-sh).toFixed(1)}" width="${bw}" height="${sh.toFixed(1)}" fill="#4ade80" rx="2"/>
            <rect x="${(cx+1).toFixed(1)}" y="${(P.t+CH-ch).toFixed(1)}" width="${bw}" height="${ch.toFixed(1)}" fill="#f87171" rx="2"/>
            <text x="${cx.toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="middle">${d.label}</text>`;
        }).join("")}
        <text x="${W-P.r-50}" y="${P.t+10}" fill="#4ade80" font-size="7">■ Scored</text>
        <text x="${W-P.r-20}" y="${P.t+10}" fill="#f87171" font-size="7">■ Conceded</text>
    </svg>`;
}

function formChart(data) {
    const maxPts = data[data.length - 1]?.value ?? 1;
    const n = data.length;
    const xOf = i => P.l + (n > 1 ? i * (CW / (n - 1)) : CW / 2);
    const yOf = v => P.t + CH - (v / Math.max(maxPts, 1)) * CH;
    const rCol = r => r === "W" ? "#4ade80" : r === "D" ? "#facc15" : "#f87171";

    const linePath = data.map((d, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`).join(" ");

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="an-svg">
        ${linePath ? `<path d="${linePath}" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ""}
        ${data.map((d, i) => `
            <circle cx="${xOf(i).toFixed(1)}" cy="${yOf(d.value).toFixed(1)}" r="4" fill="${rCol(d.result)}"/>
            <text x="${xOf(i).toFixed(1)}" y="${(yOf(d.value)-8).toFixed(1)}" fill="${rCol(d.result)}" font-size="8" text-anchor="middle" font-weight="600">${d.value}pt</text>
            <text x="${xOf(i).toFixed(1)}" y="${H-4}" fill="rgba(255,255,255,.35)" font-size="8" text-anchor="middle">${d.label}</text>
        `).join("")}
    </svg>`;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function buildPlayerList(played, players) {
    const appsMap = {};
    played.forEach(m => {
        [...(m.startingXI ?? []), ...(m.substitutions ?? []).map(s => s.playerOn)]
            .filter(id => typeof id === "number")
            .forEach(id => { appsMap[id] = (appsMap[id] ?? 0) + 1; });
    });
    return Object.entries(appsMap)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => players.find(p => p.id === Number(id)) ?? { id: Number(id), name: `Player ${id}` });
}

function getMinutes(pid, m) {
    const inXI    = m.startingXI?.includes(pid);
    const offSub  = m.substitutions?.find(s => s.playerOff === pid);
    const onSub   = m.substitutions?.find(s => s.playerOn  === pid);
    if (inXI)   return offSub ? offSub.minute : 90;
    if (onSub)  return 90 - onSub.minute;
    return 0;
}

const OPP_SHORT = {
    "Atlético de Madrid":"Atl","FC Barcelona":"Barca","Athletic Club":"Ath",
    "Real Sociedad":"RSO","Rayo Vallecano":"Rayo","RCD Espanyol de Barcelona":"Esp",
    "RCD Mallorca":"Mall","Deportivo Alavés":"Alav","Alaves":"Alav",
    "Villarreal CF":"Vila","Getafe CF":"Get","Sevilla FC":"Sev",
    "Valencia CF":"Val","CA Osasuna":"Osa","SD Eibar":"Eib",
    "Elche CF":"Elche","Girona FC":"Giro","Levante":"Lev",
    "Real Betis":"Bet","Real Betis Balompié":"Bet",
    "Olympique de Marseille":"OM","Marseille":"OM",
    "Brøndby IF":"BIF","Manchester City":"MCI","Manchester United":"MU",
    "GNK Dinamo Zagreb":"Din","SL Benfica":"Ben","Feyenoord":"Fey",
    "Qarabağ FK":"QFK","PSV":"PSV","Bayer 04 Leverkusen":"B04",
    "Borussia Dortmund":"BVB","SK Slavia Praha":"Sla","FC Bayern München":"Bay",
    "Fenerbahçe SK":"Fen","Celtic":"Celt","Rangers":"Rang","AS Monaco":"Mon",
    "Galatasaray SK":"Gala","Juventus":"Juv","Inter Milan":"Int",
    "Arsenal":"Ars","Paris Saint-Germain":"PSG","AC Milan":"Mil",
    "BK Häcken":"Häc","RB Leipzig":"RBL","Club Brugge":"Bru",
    "FK Bodø/Glimt":"Bod","Chelsea":"Che","FC Red Bull Salzburg":"Sal","AS Roma":"Rom",
};
const shortOpp = opp => OPP_SHORT[opp] ?? opp.slice(0, 4);

function tabs(list, active) {
    return list.map(({ k, l }) =>
        `<button class="an-tab${k === active ? " active" : ""}" data-chart="${k}">${l}</button>`
    ).join("");
}

function noData(msg = "No data available") {
    return `<div class="an-no-data">${msg}</div>`;
}
