// ==========================================
// CareerOS — Club Primary Colors
// ==========================================

const COLORS = {
    // Real Madrid
    "Real Madrid":          "#D4AF37",

    // La Liga
    "Alaves":               "#1a4a8a",
    "Levante":              "#c8102e",
    "Levante UD":           "#c8102e",
    "Real Sociedad":        "#2563a8",
    "RCD Mallorca":         "#e2001a",
    "Real Betis":           "#00a650",
    "Valencia CF":          "#e07b00",
    "CA Osasuna":           "#c0392b",
    "Athletic Club":        "#c0392b",
    "RCD Espanyol":         "#2563a8",
    "Sevilla FC":           "#d4021d",
    "FC Barcelona":         "#a50044",
    "SD Eibar":             "#1a5276",
    "Villarreal CF":        "#f0c620",
    "Getafe CF":            "#1a5f9e",
    "Elche CF":             "#2e7d32",
    "Girona FC":            "#c0392b",
    "Atlético de Madrid":   "#cc2529",
    "Real Club Celta":      "#79c5e9",

    // Champions League
    "Marseille":            "#009fda",
    "Brøndby IF":           "#f5c518",
    "Manchester City":      "#6cabdd",
    "GNK Dinamo Zagreb":    "#1a3a8f",
    "SL Benfica":           "#c0392b",
    "Sporting CP":          "#007a33",
};

export function getClubColor(name) {
    return COLORS[name] ?? "#64748b";
}
