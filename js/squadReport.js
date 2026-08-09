// ==========================================
// CareerOS — Squad Report Screen
// Renders data from data/scout-report.json
// ==========================================

function renderRating(s) {
    return `<div class="sqr-rating-block">
        <div class="sqr-rating-score">${s.rating ?? "—"}</div>
        <div class="sqr-rating-label">Overall Squad Rating</div>
        <p class="sqr-body">${s.content}</p>
    </div>`;
}

function renderPositive(s) {
    return s.items.map(it => `
        <div class="sqr-item sqr-item--green">
            <div class="sqr-item-heading">${it.heading}</div>
            <p class="sqr-body">${it.body}</p>
            <div class="sqr-verdict sqr-verdict--green">✅ ${it.verdict}</div>
        </div>`).join("");
}

function renderWarning(s) {
    return s.items.map(it => `
        <div class="sqr-item sqr-item--amber">
            <div class="sqr-item-heading">${it.heading}</div>
            <p class="sqr-body">${it.body}</p>
            <div class="sqr-verdict sqr-verdict--amber">⚠️ ${it.verdict}</div>
        </div>`).join("");
}

function renderNegative(s) {
    return `<div class="sqr-item sqr-item--red"><p class="sqr-body">${s.content}</p></div>`;
}

function renderPlayers(s) {
    return s.items.map(p => `
        <div class="sqr-player-row">
            <div class="sqr-player-name">${p.name}</div>
            <div class="sqr-player-status">${p.status}</div>
            <div class="sqr-player-note">${p.note}</div>
        </div>`).join("");
}

function renderLineup(s) {
    const xi = s.first_xi.map(line =>
        `<div class="sqr-lineup-line">${line}</div>`).join("");
    const rot = s.rotation.map(name =>
        `<span class="sqr-rotation-chip">${name}</span>`).join("");
    return `
        <div class="sqr-lineup-xi">
            <div class="sqr-lineup-label">First XI</div>
            ${xi}
        </div>
        <div class="sqr-lineup-rotation">
            <div class="sqr-lineup-label">Rotation</div>
            <div class="sqr-rotation-chips">${rot}</div>
        </div>
        ${s.note ? `<p class="sqr-body sqr-note">${s.note}</p>` : ""}`;
}

function renderTransfer(s) {
    const color = s.priority === "LOW" ? "#22c55e" : s.priority === "HIGH" ? "#ef4444" : "#f59e0b";
    return `
        <div class="sqr-transfer-priority" style="color:${color}">Priority: ${s.priority}</div>
        <ul class="sqr-transfer-list">
            ${s.points.map(p => `<li>${p}</li>`).join("")}
        </ul>
        ${s.note ? `<p class="sqr-body sqr-note">${s.note}</p>` : ""}`;
}

function renderTactical(s) {
    return `<p class="sqr-body">${s.content}</p>`;
}

function renderFinal(s) {
    const scores = s.scores.map(sc => `
        <div class="sqr-score-row">
            <span class="sqr-score-label">${sc.label}</span>
            <span class="sqr-score-val">${sc.score}</span>
        </div>`).join("");
    return `
        <div class="sqr-scores">${scores}</div>
        <p class="sqr-body sqr-note">${s.summary}</p>`;
}

function renderSection(s) {
    let body = "";
    switch (s.type) {
        case "rating":   body = renderRating(s);   break;
        case "positive": body = renderPositive(s); break;
        case "warning":  body = renderWarning(s);  break;
        case "negative": body = renderNegative(s); break;
        case "players":  body = renderPlayers(s);  break;
        case "lineup":   body = renderLineup(s);   break;
        case "transfer": body = renderTransfer(s); break;
        case "tactical": body = renderTactical(s); break;
        case "final":    body = renderFinal(s);    break;
        default:         body = s.content ? `<p class="sqr-body">${s.content}</p>` : "";
    }

    const accent = {
        rating: "#D4AF37", positive: "#22c55e", warning: "#f59e0b",
        negative: "#ef4444", players: "#60a5fa", lineup: "#a78bfa",
        transfer: "#22c55e", tactical: "#94a3b8", final: "#D4AF37"
    }[s.type] || "#D4AF37";

    return `
    <div class="sqr-section" style="--sqr-accent:${accent}">
        <div class="sqr-section-header">
            <span class="sqr-section-icon">${s.icon}</span>
            <span class="sqr-section-title">${s.title}</span>
        </div>
        <div class="sqr-section-body">${body}</div>
    </div>`;
}

export async function renderSquadReport() {
    const data = await fetch(`data/scout-report.json?v=${Date.now()}`).then(r => r.json()).catch(() => null);
    if (!data) return `<section class="sqr-wrap"><p style="color:var(--text-secondary);padding:20px">Failed to load report.</p></section>`;

    const meta = `<div class="sqr-meta">Generated ${data.generated} · Source: ${data.source}</div>`;
    const sections = data.sections.map(s =>
        s.type === "rating" ? { ...s, rating: data.rating } : s
    );
    return `<section class="sqr-wrap">${meta}${sections.map(renderSection).join("")}</section>`;
}
