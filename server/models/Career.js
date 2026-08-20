import mongoose from "mongoose";

const careerSchema = new mongoose.Schema({
    name:        { type: String, required: true },   // display name e.g. "Real Madrid 27/28"
    season:      { type: Object, required: true },   // { club, manager, season, competition, formation, teamMorale, trainingLevel }
    players:     { type: Array,  default: [] },
    matches:     { type: Array,  default: [] },
    standings:   { type: Object, default: {} },
    leagueStats: { type: Object, default: {} },
    scoutReport: { type: Object, default: null },
    academy:     { type: Array,  default: [] },
    transfers:   { type: Object, default: () => ({ ins: [], outs: [], loans: [] }) },
    active:      { type: Boolean, default: false },
    createdAt:   { type: Date,   default: Date.now },
});

export default mongoose.model("Career", careerSchema);
