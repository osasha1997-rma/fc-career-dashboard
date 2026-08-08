// Extract club logos from the two zip files in assets/
// Run: node scripts/extract-logos.mjs

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS    = path.join(__dirname, "..", "assets");
const OUT_DIR   = path.join(ASSETS, "logos");

// Map: our club name → slug inside the zip (256x256/<slug>.football-logos.cc.png)
const CLUB_MAP = {
    "Real Madrid":        { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "real-madrid" },
    "Alaves":             { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: null },          // not in zips
    "Levante":            { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "levante" },
    "Levante UD":         { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "levante" },
    "Real Sociedad":      { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "real-sociedad" },
    "RCD Mallorca":       { zip: "spain-la-liga-2-2026-2027.football-logos.cc.zip", slug: "mallorca" },
    "Real Betis":         { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "real-betis" },
    "Valencia CF":        { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "valencia" },
    "CA Osasuna":         { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "osasuna" },
    "Athletic Club":      { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "athletic-club" },
    "RCD Espanyol":       { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "espanyol" },
    "Sevilla FC":         { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "sevilla" },
    "FC Barcelona":       { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "barcelona" },
    "SD Eibar":           { zip: "spain-la-liga-2-2026-2027.football-logos.cc.zip", slug: "eibar" },
    "Villarreal CF":      { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "villarreal" },
    "Getafe CF":          { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "getafe" },
    "Elche CF":           { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "elche" },
    "Girona FC":          { zip: "spain-la-liga-2-2026-2027.football-logos.cc.zip", slug: "girona" },
    "Atlético de Madrid": { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "atletico-madrid" },
    "Real Club Celta":    { zip: "spain-la-liga-2026-2027.football-logos.cc.zip",   slug: "celta" },

    // UCL clubs — not in the La Liga zips, will fall back to Wikipedia downloads or initials
    "Marseille":          { zip: null, slug: null },
    "Brøndby IF":         { zip: null, slug: null },
    "Manchester City":    { zip: null, slug: null },
    "GNK Dinamo Zagreb":  { zip: null, slug: null },
    "SL Benfica":         { zip: null, slug: null },
    "Sporting CP":        { zip: null, slug: null },
};

import { inflateRawSync } from "zlib";

function readZipSync(buf) {
    const entries = new Map();
    let i = 0;
    while (i < buf.length - 4) {
        if (buf[i] === 0x50 && buf[i+1] === 0x4B && buf[i+2] === 0x03 && buf[i+3] === 0x04) {
            const compression = buf.readUInt16LE(i + 8);
            const compSize    = buf.readUInt32LE(i + 18);
            const uncompSize  = buf.readUInt32LE(i + 22);
            const fnLen       = buf.readUInt16LE(i + 26);
            const extraLen    = buf.readUInt16LE(i + 28);
            const name        = buf.slice(i + 30, i + 30 + fnLen).toString("utf8");
            const dataStart   = i + 30 + fnLen + extraLen;

            if (compression === 0) {
                entries.set(name, buf.slice(dataStart, dataStart + uncompSize));
            } else if (compression === 8) {
                entries.set(name, inflateRawSync(buf.slice(dataStart, dataStart + compSize)));
            }

            i = dataStart + compSize;
        } else {
            i++;
        }
    }
    return entries;
}

function toFilename(clubName) {
    return clubName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + ".png";
}

function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // Load both zips once
    const zips = {};
    for (const { zip } of Object.values(CLUB_MAP)) {
        if (zip && !zips[zip]) {
            zips[zip] = readZipSync(fs.readFileSync(path.join(ASSETS, zip)));
            console.log(`Loaded ${zip} (${zips[zip].size} entries)`);
        }
    }

    const mapping = {};

    for (const [clubName, { zip, slug }] of Object.entries(CLUB_MAP)) {
        const outFile = toFilename(clubName);
        const outPath = path.join(OUT_DIR, outFile);

        if (!zip || !slug) {
            // Check if a Wikipedia download exists
            if (fs.existsSync(outPath)) {
                mapping[clubName] = `assets/logos/${outFile}`;
                console.log(`✓ wiki   ${clubName}`);
            } else {
                console.warn(`✗ skip   ${clubName} (no source)`);
            }
            continue;
        }

        const entryKey = `256x256/${slug}.football-logos.cc.png`;
        const data = zips[zip]?.get(entryKey);

        if (!data) {
            console.warn(`✗ miss   ${clubName} (${entryKey} not found in zip)`);
            continue;
        }

        fs.writeFileSync(outPath, data);
        mapping[clubName] = `assets/logos/${outFile}`;
        console.log(`✓ saved  ${clubName}`);
    }

    // Write clubLogos.js
    const entries = Object.entries(mapping)
        .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
        .join(",\n");

    const jsOut = path.join(__dirname, "..", "js", "utils", "clubLogos.js");
    fs.writeFileSync(jsOut,
`// Auto-generated by scripts/extract-logos.mjs — do not edit manually
const LOGOS = {\n${entries}\n};\n\nexport function getClubLogo(name) {\n    return LOGOS[name] ?? null;\n}\n`);

    console.log(`\nDone — wrote clubLogos.js (${Object.keys(mapping).length} clubs)`);
}

main();
