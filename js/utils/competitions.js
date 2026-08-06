// ==========================================
// CareerOS — Competition Label Map
// ==========================================

export const COMPETITION_LABELS = {
    laliga:    "La Liga",
    ucl:       "UEFA Champions League",
    supercopa: "Supercopa de España"
};

export function getCompetitionLabel(slug) {
    return COMPETITION_LABELS[slug] ?? slug.toUpperCase();
}
