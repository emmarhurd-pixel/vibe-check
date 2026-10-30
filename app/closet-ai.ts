import { Type, type Schema } from "@google/genai";
import { askAI } from "./ai";
import type { Weather } from "./weather";
import type { Slot } from "./closet";

export type ClosetPiece = { id: string; name: string; slot: Slot; color: string; tags: string[] };
export type ClosetLook = { pieceIds: string[]; reason: string };
export type ClosetResult = {
  background: string;
  text: string;
  accent: string;
  looks: ClosetLook[];
  source: "ai" | "backup";
};

type ClosetRequest = {
  name?: string;
  date?: string;
  city?: string;
  style?: string;
  vibe?: string;
  attempt?: number;
  weather: Weather | null;
  closet: ClosetPiece[];
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLORS = { background: "#FAF7F2", text: "#2D2D2D", accent: "#8B5E3C" };

// ---------- Schemas ----------

const groqSchema = {
  type: "object",
  properties: {
    background: { type: "string" },
    text: { type: "string" },
    accent: { type: "string" },
    looks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pieceIds: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["pieceIds", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["background", "text", "accent", "looks"],
  additionalProperties: false,
};

const geminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    background: { type: Type.STRING },
    text: { type: Type.STRING },
    accent: { type: Type.STRING },
    looks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pieceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          reason: { type: Type.STRING },
        },
        required: ["pieceIds", "reason"],
      },
    },
  },
  required: ["background", "text", "accent", "looks"],
};

// ---------- Cleaning up a look ----------

function cleanLook(ids: string[], byId: Map<string, ClosetPiece>): string[] {
  const seen = new Set<string>();
  const counts: Partial<Record<Slot, number>> = {};
  const kept: string[] = [];

  for (const id of ids) {
    const piece = byId.get(id);
    if (!piece || seen.has(id)) continue;
    const count = counts[piece.slot] ?? 0;
    if ((piece.slot === "bottoms" || piece.slot === "shoes") && count >= 1) continue;
    seen.add(id);
    counts[piece.slot] = count + 1;
    kept.push(id);
  }

  const hasTop = kept.some((id) => byId.get(id)?.slot === "tops");
  return hasTop ? kept : [];
}

// ---------- Backup stylist (no AI) ----------

function backupLooks(closet: ClosetPiece[], weather: Weather | null, attempt: number): ClosetLook[] {
  const cold = weather ? weather.high < 60 : false;
  const hot = weather ? weather.high >= 80 : false;
  const rainy = (weather?.rainChance ?? 0) >= 50;

  const score = (piece: ClosetPiece) => {
    let s = 0;
    if (cold && piece.tags.includes("warm")) s += 2;
    if (cold && piece.tags.includes("lightweight")) s -= 1;
    if (hot && piece.tags.includes("lightweight")) s += 2;
    if (hot && piece.tags.includes("warm")) s -= 2;
    if (rainy && piece.tags.includes("waterproof")) s += 2;
    return s;
  };

  const inSlot = (slot: Slot) =>
    closet.filter((p) => p.slot === slot).sort((a, b) => score(b) - score(a));

  const tops = inSlot("tops");
  const bottoms = inSlot("bottoms");
  const shoes = inSlot("shoes");
  const outerwear = inSlot("outerwear");

  const looks: ClosetLook[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < 3 && tops.length > 0; i++) {
    const k = attempt * 3 + i;
    const ids = [tops[k % tops.length].id];
    if (bottoms.length) ids.push(bottoms[k % bottoms.length].id);
    if (shoes.length) ids.push(shoes[k % shoes.length].id);
    if ((cold || rainy) && outerwear.length) ids.push(outerwear[k % outerwear.length].id);

    const key = ids.join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    const weatherNote = cold ? "layered for the cold" : hot ? "kept light for the heat" : rainy ? "ready for rain" : "easy for the day";
    looks.push({ pieceIds: ids, reason: `A simple combo from your closet, ${weatherNote}.` });
  }

  return looks;
}

// ---------- The AI request ----------

function buildPrompt(req: ClosetRequest, shortIds: string[]): string {
  const weatherText = req.weather
    ? `${req.weather.description}, high ${req.weather.high}°F, low ${req.weather.low}°F${
        req.weather.rainChance != null ? `, ${req.weather.rainChance}% chance of rain` : ""
      }`
    : "unknown";

  const lines = req.closet
    .map((p, i) => `${shortIds[i]} | ${p.slot} | ${p.name} | ${p.color} | ${p.tags.join(", ") || "-"}`)
    .join("\n");

  const attemptText = req.attempt
    ? `This is attempt #${req.attempt + 1}. Choose noticeably different combinations than usual.`
    : "";

  return `You are a personal stylist choosing everyday outfits ONLY from the user's closet below.

Day: ${req.name || "Casual day"}
Date: ${req.date}
City: ${req.city}
Weather: ${weatherText}
Clothing style: ${req.style || "No preference"}
Personal vibe: ${req.vibe || "none given"}
${attemptText}

Closet (id | type | name | color | tags):
${lines}

Rules:
- Use only ids from the closet list above. Never invent pieces.
- Each look needs at least one top, exactly one bottom (unless a top is a dress or jumpsuit), and one pair of shoes if the closet has shoes.
- Add outerwear when it's cool, cold, windy, or rainy. Tops and outerwear can be layered.
- Add 0 to 2 accessories that finish the look.
- Pick colors that work well together and pieces that suit the weather. Respect tags like warm, lightweight, waterproof, dressy, and athletic.
- Return up to 3 different looks, best first.
- reason: 1 to 2 friendly sentences on why the look works, mentioning the colors and the weather.
- background, text, accent: 6-digit hex page colors that flatter the best look, with text that is easy to read on the background.`;
}

export async function pickFromCloset(req: ClosetRequest): Promise<ClosetResult> {
  const byId = new Map(req.closet.map((p) => [p.id, p]));
  const shortIds = req.closet.map((_, i) => `p${i + 1}`);
  const shortToReal = new Map(shortIds.map((s, i) => [s, req.closet[i].id]));

  const backup = (): ClosetResult => ({
    ...DEFAULT_COLORS,
    looks: backupLooks(req.closet, req.weather, req.attempt ?? 0),
    source: "backup",
  });

  if (process.env.USE_MOCK_AI === "true") return backup();

  try {
    return await askAI(
      buildPrompt(req, shortIds),
      { name: "closet_outfits", groq: groqSchema, gemini: geminiSchema },
      (data) => {
        const raw = data as {
          background: string;
          text: string;
          accent: string;
          looks: { pieceIds: string[]; reason: string }[];
        };
        if (!raw || !Array.isArray(raw.looks)) throw new Error("AI answer had no looks");

        const looks = raw.looks
          .map((look) => ({
            pieceIds: cleanLook(
              (look.pieceIds ?? []).map((s) => shortToReal.get(s) ?? ""),
              byId
            ),
            reason: String(look.reason ?? ""),
          }))
          .filter((look) => look.pieceIds.length > 0)
          .slice(0, 3);

        if (looks.length === 0) throw new Error("AI picked no valid looks");

        return {
          background: HEX.test(raw.background) ? raw.background : DEFAULT_COLORS.background,
          text: HEX.test(raw.text) ? raw.text : DEFAULT_COLORS.text,
          accent: HEX.test(raw.accent) ? raw.accent : DEFAULT_COLORS.accent,
          looks,
          source: "ai" as const,
        };
      }
    );
  } catch {
    return backup();
  }
}