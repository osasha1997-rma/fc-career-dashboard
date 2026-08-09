// ==========================================
// CareerOS — FC26 Data Utility
// Lazy-loads fc26.json, matches squad players
// ==========================================

let _data = null;
let _loading = null;

export async function loadFC26() {
    if (_data) return _data;
    if (_loading) return _loading;
    _loading = fetch("data/fc26.json")
        .then(r => r.json())
        .then(d => { _data = d; return d; });
    return _loading;
}

// Normalize string: lowercase + strip diacritics
function norm(s = "") {
    return s.toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

// Match a squad player name to a FC26 player entry
export function matchFC26Player(name, fc26Data) {
    const n = norm(name);
    const tokens = n.split(/\s+/).filter(Boolean);
    const first = tokens[0];
    const last = tokens[tokens.length - 1];

    // Strategy 1: exact normalized long_name
    let m = fc26Data.find(p => norm(p.long_name) === n);
    if (m) return m;

    // Strategy 2: all squad name tokens appear in long_name
    m = fc26Data
        .filter(p => { const ln = norm(p.long_name); return tokens.every(t => ln.includes(t)); })
        .sort((a, b) => b.overall - a.overall)[0];
    if (m) return m;

    // Strategy 3: first + last token both appear in long_name (min 2 tokens)
    if (tokens.length >= 2) {
        const candidates = fc26Data.filter(p => {
            const ln = norm(p.long_name);
            return ln.includes(first) && ln.includes(last);
        });
        if (candidates.length) return candidates.sort((a, b) => b.overall - a.overall)[0];
    }

    return null;
}

// Build a squad → FC26 map: { squadPlayerId: fc26Entry }
export function buildSquadFC26Map(squadPlayers, fc26Data) {
    const map = {};
    for (const sp of squadPlayers) {
        const match = matchFC26Player(sp.name, fc26Data);
        if (match) map[sp.id] = match;
    }
    return map;
}

// Stat display config
export const STAT_META = [
    { key: "pace",      label: "PAC", color: "#f97316" },
    { key: "shooting",  label: "SHO", color: "#ef4444" },
    { key: "passing",   label: "PAS", color: "#3b82f6" },
    { key: "dribbling", label: "DRI", color: "#d4af37" },
    { key: "defending", label: "DEF", color: "#22c55e" },
    { key: "physic",    label: "PHY", color: "#8b5cf6" },
];

// Format value_eur as "€45M" / "€450K"
export function fmtValue(v) {
    if (!v) return "—";
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v}`;
}

// Position family grouping
export const POSITION_GROUPS = {
    GK:  ["GK"],
    DEF: ["CB","LB","RB","LWB","RWB"],
    MID: ["CDM","CM","CAM","LM","RM"],
    ATT: ["LW","RW","ST","CF","LF","RF"],
};

export function posGroup(positions = "") {
    const pos = (positions || "").split(",").map(p => p.trim())[0];
    for (const [g, list] of Object.entries(POSITION_GROUPS)) {
        if (list.includes(pos)) return g;
    }
    return "MID";
}
