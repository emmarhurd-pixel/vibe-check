import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { fonts, defaultTheme, type Theme, type Wardrobe } from "./themes";
import type { Weather } from "./weather";
import { fixWardrobe } from "./color-names";

const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_MODEL = "gemini-3.8-flash";
const TIME_LIMIT_MS = 20000;

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cache = new Map<string, Theme>();

type EventInfo = {
  type?: string;
  name?: string;
  date?: string;
  city?: string;
  venue?: string;
  style?: string;
  vibe?: string;
  weather?: Weather | null;
  attempt?: number;
};

type RawTheme = {
  background: string;
  text: string;
  accent: string;
  palette: string[];
  font: string;
  items: string[];
  searches: string[];
  wardrobe: Wardrobe;
};

// ---------- The prompt (shared by both AI services) ----------

function buildPrompt(event: EventInfo): string {
  const weatherText = event.weather
    ? `${event.weather.description}, high ${event.weather.high}°F, low ${event.weather.low}°F${
        event.weather.rainChance != null ? `, ${event.weather.rainChance}% chance of rain` : ""
      }`
    : "unknown";

  const attemptText = event.attempt
    ? `This is attempt #${event.attempt + 1}. Give a noticeably different take, with a new palette and different pieces.`
    : "";

  return `You are a fashion stylist creating an outfit theme for this event:
Event type: ${event.type}
Event name: ${event.name}
Date: ${event.date}
City: ${event.city}
Venue: ${event.venue}
Clothing style: ${event.style}
Personal vibe: ${event.vibe || "none given"}
Weather: ${weatherText}
${attemptText}
If the venue is outdoors, the outfit must suit the weather. If it's indoors,
still plan for getting there, like a coat or umbrella when needed.
The wardrobe options should all mix and match with each other and fit the palette,
and tops and outerwear should work layered together.

Base the colors and vibe on the event itself, such as a show's set and costume design,
an artist's or fandom's signature colors, or the occasion's dress code.
The text color must be easy to read on the background color.
All colors must be 6-digit hex codes like #A1B2C3.
Each wardrobe piece's hex must match the color in its name. A "sage green" piece needs a sage green hex, never a blue one.

Return:
- background, text, accent: hex colors for the page
- palette: exactly 5 hex colors for the outfit palette
- font: the font that best fits the vibe, one of:
  inter (clean, modern, minimal), playfair (elegant, romantic, theatrical),
  spaceGrotesk (edgy, bold, techy, concert energy), cinzel (classical, regal, dramatic, mythological),
  quicksand (soft, cute, playful)
- items: 5 to 7 specific clothing pieces and accessories
- searches: 3 short search terms for full outfit photos, like "burgundy slip dress street style"
- wardrobe: 2 to 3 options each for tops, bottoms, outerwear, shoes, and accessories,
  each with a short name like "Rust silk camisole" and its main color as a hex code`;
}

// ---------- Checking the AI's answer ----------

const HEX = /^#[0-9a-fA-F]{6}$/;
const SLOTS: (keyof Wardrobe)[] = ["tops", "bottoms", "outerwear", "shoes", "accessories"];

function toTheme(data: unknown): Theme {
  const raw = data as RawTheme;
  const valid =
    raw &&
    HEX.test(raw.background) &&
    HEX.test(raw.text) &&
    HEX.test(raw.accent) &&
    Array.isArray(raw.palette) &&
    Array.isArray(raw.items) &&
    Array.isArray(raw.searches) &&
    raw.wardrobe &&
    SLOTS.every((slot) => Array.isArray(raw.wardrobe[slot]));

  if (!valid) throw new Error("AI answer was missing pieces of the theme");

  const font = fonts[raw.font as keyof typeof fonts] ?? fonts.inter;

  return {
    background: raw.background,
    text: raw.text,
    accent: raw.accent,
    palette: raw.palette.filter((color) => HEX.test(color)),
    fontClass: font.className,
    items: raw.items,
    searches: raw.searches,
    wardrobe: fixWardrobe(raw.wardrobe),
  };
}

// ---------- Groq ----------

const pieceJson = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      color: { type: "string" },
    },
    required: ["name", "color"],
    additionalProperties: false,
  },
};

const groqSchema = {
  type: "object",
  properties: {
    background: { type: "string" },
    text: { type: "string" },
    accent: { type: "string" },
    palette: { type: "array", items: { type: "string" } },
    font: { type: "string", enum: Object.keys(fonts) },
    items: { type: "array", items: { type: "string" } },
    searches: { type: "array", items: { type: "string" } },
    wardrobe: {
      type: "object",
      properties: {
        tops: pieceJson,
        bottoms: pieceJson,
        outerwear: pieceJson,
        shoes: pieceJson,
        accessories: pieceJson,
      },
      required: ["tops", "bottoms", "outerwear", "shoes", "accessories"],
      additionalProperties: false,
    },
  },
  required: ["background", "text", "accent", "palette", "font", "items", "searches", "wardrobe"],
  additionalProperties: false,
};

async function askGroq(prompt: string): Promise<unknown> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: { name: "outfit_theme", strict: true, schema: groqSchema },
      },
    }),
    signal: AbortSignal.timeout(TIME_LIMIT_MS),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ---------- Gemini ----------

const pieceList = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      color: { type: Type.STRING },
    },
    required: ["name", "color"],
  },
};

const geminiSchema = {
  type: Type.OBJECT,
  properties: {
    background: { type: Type.STRING },
    text: { type: Type.STRING },
    accent: { type: Type.STRING },
    palette: { type: Type.ARRAY, items: { type: Type.STRING } },
    font: { type: Type.STRING, enum: Object.keys(fonts) },
    items: { type: Type.ARRAY, items: { type: Type.STRING } },
    searches: { type: Type.ARRAY, items: { type: Type.STRING } },
    wardrobe: {
      type: Type.OBJECT,
      properties: {
        tops: pieceList,
        bottoms: pieceList,
        outerwear: pieceList,
        shoes: pieceList,
        accessories: pieceList,
      },
      required: ["tops", "bottoms", "outerwear", "shoes", "accessories"],
    },
  },
  required: ["background", "text", "accent", "palette", "font", "items", "searches", "wardrobe"],
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI took longer than ${ms / 1000} seconds`)), ms)
    ),
  ]);
}

async function askGemini(prompt: string): Promise<unknown> {
  const response = await withTimeout(
    gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: geminiSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }),
    TIME_LIMIT_MS
  );
  return JSON.parse(response.text ?? "");
}

// ---------- What the rest of the app uses ----------

export async function generateTheme(event: EventInfo): Promise<Theme> {
  if (!event.name) return defaultTheme;
  if (process.env.USE_MOCK_AI === "true") return defaultTheme;

  const cacheKey = JSON.stringify(event);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = buildPrompt(event);

  const services: { name: string; ask: (prompt: string) => Promise<unknown> }[] = [];
  if (process.env.GROQ_API_KEY) services.push({ name: "Groq", ask: askGroq });
  if (process.env.GEMINI_API_KEY) services.push({ name: "Gemini", ask: askGemini });

  for (const service of services) {
    try {
      const started = Date.now();
      const theme = toTheme(await service.ask(prompt));
      console.log(`Theme from ${service.name} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      cache.set(cacheKey, theme);
      return theme;
    } catch (error) {
      console.error(`${service.name} failed:`, error);
    }
  }

  return defaultTheme;
}