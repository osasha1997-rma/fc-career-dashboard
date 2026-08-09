// ==========================================
// CareerOS — Season Calendar
// ==========================================

import { getClubLogo }                          from "./utils/clubLogos.js";
import { getCompetitionLabel, getCompetitionColor } from "./utils/competitions.js";

let _matches = [];

export function createCalendar(matches = []) {
    _matches = matches;

    const dated   = [...matches].filter(m => m.date).sort((a, b) => a.date.localeCompare(b.date));
    const undated = matches.filter(m => !m.date && m.result);

    const months = {};
    dated.forEach(m => {
        const d   = new Date(m.date + "T00:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!months[key]) {
            months[key] = {
                label: d.toLocaleString("en-GB", { month: "long", year: "numeric" }),
                matches: []
            };
        }
        months[key].matches.push(m);
    });

    return `
    <section class="cal-page fade">
        <div class="page-header">
            <h1>Season Calendar</h1>
            <p>2027/28 · ${matches.length} fixtures</p>
        </div>
        <div class="cal-body">
            ${undated.length ? `
            <div class="cal-month">
                <div class="cal-month-header">Earlier Results</div>
                ${undated.map(calRow).join("")}
            </div>` : ""}
            ${Object.values(months).map(({ label, matches: ms }) => `
            <div class="cal-month">
                <div class="cal-month-header">${label}</div>
                ${ms.map(calRow).join("")}
            </div>`).join("")}
        </div>
    </section>`;
}

function calRow(m) {
    const logo  = getClubLogo(m.opponent);
    const crest = logo
        ? `<img src="${logo}" class="cal-crest" alt="${m.opponent}" onerror="this.style.display='none'">`
        : `<span class="cal-crest cal-crest--init">${m.opponent[0]}</span>`;

    const cc      = getCompetitionColor(m.competition);
    const compDot = `<span class="cal-comp-dot" style="background:${cc.text}" title="${getCompetitionLabel(m.competition)}"></span>`;

    const dateStr = m.date
        ? new Date(m.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })
        : "—";

    const venueLabel = m.venue === "Home" ? "H" : "A";
    const venueCls   = m.venue === "Home" ? "cal-venue--home" : "cal-venue--away";

    let right;
    if (m.result) {
        const cls = m.result === "W" ? "win" : m.result === "D" ? "draw" : "loss";
        right = `<span class="cal-badge cal-badge--${cls}">${m.result} ${m.scoreFor}–${m.scoreAgainst}</span>`;
    } else {
        right = `<span class="cal-badge cal-badge--upcoming">upcoming</span>`;
    }

    return `
    <div class="cal-row${m.result ? "" : " cal-row--upcoming"}" data-id="${m.id}">
        <span class="cal-date">${dateStr}</span>
        ${compDot}
        <span class="cal-venue ${venueCls}">${venueLabel}</span>
        ${crest}
        <span class="cal-opp">${m.opponent}</span>
        ${right}
    </div>`;
}

export function initializeCalendar(onMatchClick) {
    document.querySelector(".cal-body")?.addEventListener("click", e => {
        const row = e.target.closest(".cal-row");
        if (!row) return;
        onMatchClick?.(Number(row.dataset.id));
    });
}
