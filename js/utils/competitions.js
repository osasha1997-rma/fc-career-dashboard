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

// Shared opponent abbreviation — skips generic prefixes, takes first meaningful word
const _GENERIC = new Set(["Real","RCD","SD","FC","CA","CF","GNK","SL","UD","de","OM"]);
const _OPP_OVERRIDE = {
    "Atlético de Madrid":"Atl","FC Barcelona":"Barça","Athletic Club":"Ath",
    "Real Sociedad":"RSO","Rayo Vallecano":"Rayo","RCD Espanyol de Barcelona":"Esp",
    "RCD Mallorca":"Mall","Deportivo Alavés":"Alav","Villarreal CF":"Vila",
    "Getafe CF":"Get","Sevilla FC":"Sev","Valencia CF":"Val","CA Osasuna":"Osa",
    "Girona FC":"Giro","Levante":"Lev","Real Betis":"Bet","Real Betis Balompié":"Bet",
    "Olympique de Marseille":"OM","Marseille":"OM","GNK Dinamo Zagreb":"Din",
    "SL Benfica":"Ben","Feyenoord":"Fey","PSV":"PSV","Bayer 04 Leverkusen":"B04",
    "Borussia Dortmund":"BVB","SK Slavia Praha":"Sla","FC Bayern München":"Bay",
    "Fenerbahçe SK":"Fen","AS Monaco":"Mon","Galatasaray SK":"Gala","Juventus":"Juv",
    "Inter Milan":"Int","Arsenal":"Ars","Paris Saint-Germain":"PSG","AC Milan":"Mil",
    "RB Leipzig":"RBL","Club Brugge":"Bru","Chelsea":"Che","AS Roma":"Rom",
    "Manchester City":"MCI","Manchester United":"MU","Brøndby IF":"BIF",
    "Liverpool":"LIV","Tottenham Hotspur":"Spurs",
};
export function shortOpp(name = "") {
    if (_OPP_OVERRIDE[name]) return _OPP_OVERRIDE[name];
    const word = name.split(" ").find(w => !_GENERIC.has(w));
    return (word ?? name).slice(0, 5);
}
