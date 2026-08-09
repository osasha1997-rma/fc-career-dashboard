// ==========================================
// CareerOS — AI Scout (Google Gemini)
// ==========================================

let _config = null;

async function loadConfig() {
    const r = await fetch(`data/ai-config.json?v=${Date.now()}`);
    _config = await r.json();
    return _config;
}

function geminiUrl(model, apiKey, stream = true) {
    const method = stream ? "streamGenerateContent" : "generateContent";
    const sse    = stream ? "&alt=sse" : "";
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${apiKey}${sse}`;
}

// Build the full context prompt from squad + match data
export function buildScoutPrompt(players, matches, fc26Map, season) {
    const played   = matches.filter(m => m.result);
    const wins     = played.filter(m => m.result === "W").length;
    const draws    = played.filter(m => m.result === "D").length;
    const losses   = played.filter(m => m.result === "L").length;
    const gf       = played.reduce((s, m) => s + (m.scoreFor ?? 0), 0);
    const ga       = played.reduce((s, m) => s + (m.scoreAgainst ?? 0), 0);
    const avgPoss  = played.length
        ? Math.round(played.reduce((s, m) => s + (m.teamStats?.possession ?? 50), 0) / played.length)
        : 50;

    const squadLines = players
        .filter(p => p.overall >= 75)
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 20)
        .map(p => {
            const fc = fc26Map[p.id];
            const attrs = fc
                ? `PAC:${fc.pace} SHO:${fc.shooting} PAS:${fc.passing} DRI:${fc.dribbling} DEF:${fc.defending} PHY:${fc.physic} POT:${fc.potential}`
                : `OVR:${p.overall} POT:${p.potential}`;
            return `  ${p.position.padEnd(4)} ${p.name.padEnd(25)} OVR:${p.overall} ${attrs} Age:${p.age}`;
        })
        .join("\n");

    return `You are an elite football scout for Real Madrid in FC 26 career mode.

SEASON: ${season.season ?? "2027/28"} | ${season.formation ?? "4-2-3-1"} | ${wins}W ${draws}D ${losses}L | GF:${gf} GA:${ga} | Poss:${avgPoss}% | Budget:€${((season.transferBudget ?? 0)/1e6).toFixed(0)}M
FORM: ${played.slice(-5).map(m=>`${m.result}(${m.scoreFor}-${m.scoreAgainst})`).join(" ")}

SQUAD:
${squadLines}

Give a scouting report with exactly these 5 sections (use **bold** headers):
**1. Tactical Analysis** — formation effectiveness, style, what's working.
**2. Squad Weaknesses** — 2-3 positional/attribute gaps with player evidence.
**3. Transfer Priorities** — specific player types + attribute thresholds needed.
**4. Sell Candidates** — underperforming or ageing squad members.
**5. Bold Suggestion** — one creative tactical or transfer idea.

3-4 sentences per section. Use real football terminology.`;
}

// Stream response from Gemini
export async function streamScoutAnalysis(prompt, onChunk, onDone, onError) {
    try {
        const cfg = await loadConfig();
        const url = geminiUrl(cfg.model ?? "gemini-2.0-flash", cfg.apiKey, true);

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: "You are an elite football scout who gives detailed, tactical transfer advice based on real football principles." }]
                },
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message ?? `API error ${response.status}`);
        }

        await readGeminiStream(response, onChunk, onDone);
    } catch (err) {
        onError?.(err.message);
    }
}

// Follow-up question with conversation history
export async function askFollowUp(history, question, onChunk, onDone, onError) {
    try {
        const cfg = await loadConfig();
        const url = geminiUrl(cfg.model ?? "gemini-2.0-flash", cfg.apiKey, true);

        // Convert OpenAI-style history to Gemini format
        // history entries are {role: "user"|"assistant", content: string}
        const contents = history.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }));
        contents.push({ role: "user", parts: [{ text: question }] });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: "You are an elite football scout advising on a Real Madrid FIFA career mode. Answer concisely and specifically." }]
                },
                contents,
                generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message ?? `API error ${response.status}`);
        }

        await readGeminiStream(response, onChunk, onDone);
    } catch (err) {
        onError?.(err.message);
    }
}

// Parse Gemini SSE stream — lines are "data: {...}"
async function readGeminiStream(response, onChunk, onDone) {
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
                const json = JSON.parse(data);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                if (text) onChunk(text);
            } catch { /* ignore partial JSON at stream boundaries */ }
        }
    }
    onDone?.();
}
