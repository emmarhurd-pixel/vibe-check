// import { GoogleGenAI, Type } from "@google/genai";
// import { fonts, defaultTheme, type Theme } from "./themes";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//    type EventInfo = {
//      type?: string;
//      name?: string;
//      date?: string;
//      city?: string;
//      venue?: string;
//      style?: string;
//      vibe?: string;
//    };

// async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
//   for (let i = 1; ; i++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (i >= attempts) throw error;
//       await new Promise((resolve) => setTimeout(resolve, 1000 * i));
//     }
//   }
// }

// export async function generateTheme(event: EventInfo): Promise<Theme> {
//   const prompt = `You are a fashion stylist creating an outfit theme for this event:
// Event type: ${event.type}
// Event name: ${event.name}
// Date: ${event.date}
// City: ${event.city}
// Venue: ${event.venue}
// Clothing style: ${event.style}
// Personal vibe: ${event.vibe || "none given"}

// Base the colors and vibe on the event itself, such as a show's set and costume design,
// an artist's or fandom's signature colors, or the occasion's dress code.
// The text color must be easy to read on the background color.

// Choose the font that best fits the vibe:
// - inter: clean, modern, minimal
// - playfair: elegant, romantic, theatrical
// - spaceGrotesk: edgy, bold, techy, concert energy
// - cinzel: classical, regal, dramatic, mythological
// - quicksand: soft, cute, playful`;

//   try {
//     const response = await withRetry(() => ai.models.generateContent({
//       model: "gemini-3.8-flash",
//       contents: prompt,
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: Type.OBJECT,
//           properties: {
//             background: { type: Type.STRING, description: "Hex color for the page background" },
//             text: { type: Type.STRING, description: "Hex color for body text" },
//             accent: { type: Type.STRING, description: "Hex color for headings" },
//             palette: {
//               type: Type.ARRAY,
//               items: { type: Type.STRING },
//               description: "Exactly 5 hex colors for the outfit palette",
//             },
//             font: { type: Type.STRING, enum: Object.keys(fonts) },
//             items: {
//               type: Type.ARRAY,
//               items: { type: Type.STRING },
//               description: "5 to 7 specific clothing pieces and accessories",
//             },
//           },
//           required: ["background", "text", "accent", "palette", "font", "items"],
//         },
//       },
//     }));

//     const data = JSON.parse(response.text ?? "");
//     const font = fonts[data.font as keyof typeof fonts] ?? fonts.inter;

//     return {
//       background: data.background,
//       text: data.text,
//       accent: data.accent,
//       palette: data.palette,
//       fontClass: font.className,
//       items: data.items,
//     };
//   } catch (error) {
//     console.error("Theme generation failed:", error);
//     return defaultTheme;
//   }
// }

import { GoogleGenAI, Type } from "@google/genai";
import { fonts, defaultTheme, type Theme } from "./themes";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cache = new Map<string, Theme>();

type EventInfo = {
  type?: string;
  name?: string;
  date?: string;
  city?: string;
  venue?: string;
  style?: string;
  vibe?: string;
};

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 503 || i >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * i));
    }
  }
}

export async function generateTheme(event: EventInfo): Promise<Theme> {
  if (!event.name) return defaultTheme;
  if (process.env.USE_MOCK_AI === "true") return defaultTheme;

  const cacheKey = JSON.stringify(event);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = `You are a fashion stylist creating an outfit theme for this event:
Event type: ${event.type}
Event name: ${event.name}
Date: ${event.date}
City: ${event.city}
Venue: ${event.venue}
Clothing style: ${event.style}
Personal vibe: ${event.vibe || "none given"}

Base the colors and vibe on the event itself, such as a show's set and costume design,
an artist's or fandom's signature colors, or the occasion's dress code.
The text color must be easy to read on the background color.

Choose the font that best fits the vibe:
- inter: clean, modern, minimal
- playfair: elegant, romantic, theatrical
- spaceGrotesk: edgy, bold, techy, concert energy
- cinzel: classical, regal, dramatic, mythological
- quicksand: soft, cute, playful`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              background: { type: Type.STRING, description: "Hex color for the page background" },
              text: { type: Type.STRING, description: "Hex color for body text" },
              accent: { type: Type.STRING, description: "Hex color for headings" },
              palette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 5 hex colors for the outfit palette",
              },
              font: { type: Type.STRING, enum: Object.keys(fonts) },
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "5 to 7 specific clothing pieces and accessories",
              },
            },
            required: ["background", "text", "accent", "palette", "font", "items"],
          },
        },
      })
    );

    const data = JSON.parse(response.text ?? "");
    const font = fonts[data.font as keyof typeof fonts] ?? fonts.inter;

    const theme: Theme = {
      background: data.background,
      text: data.text,
      accent: data.accent,
      palette: data.palette,
      fontClass: font.className,
      items: data.items,
    };

    cache.set(cacheKey, theme);
    return theme;
  } catch (error) {
    console.error("Theme generation failed:", error);
    return defaultTheme;
  }
}