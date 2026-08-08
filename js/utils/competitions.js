// ==========================================
// CareerOS — Competition Label Map
// ==========================================

export const COMPETITION_LABELS = {
    laliga:       "La Liga",
    ucl:          "UEFA Champions League",
    supercopa:    "Supercopa de España",
    copadelrey:   "Copa del Rey",
    clubworldcup: "Club World Cup"
};

export function getCompetitionLabel(slug) {
    return COMPETITION_LABELS[slug] ?? slug.toUpperCase();
}

const COMPETITION_COLORS = {
    laliga:       { bg: "rgba(239,68,68,.15)",   border: "rgba(239,68,68,.5)",   text: "#f87171" },
    ucl:          { bg: "rgba(59,130,246,.15)",  border: "rgba(59,130,246,.5)",  text: "#60a5fa" },
    supercopa:    { bg: "rgba(168,85,247,.15)",  border: "rgba(168,85,247,.5)",  text: "#c084fc" },
    copadelrey:   { bg: "rgba(234,179,8,.15)",   border: "rgba(234,179,8,.5)",   text: "#facc15" },
    clubworldcup: { bg: "rgba(20,184,166,.15)",  border: "rgba(20,184,166,.5)",  text: "#2dd4bf" }
};

export function getCompetitionColor(slug) {
    return COMPETITION_COLORS[slug] ?? { bg: "rgba(212,175,55,.1)", border: "rgba(212,175,55,.3)", text: "#D4AF37" };
}
