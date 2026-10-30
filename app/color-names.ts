import type { Wardrobe } from "./themes";

type Hsl = { h: number; s: number; l: number };
type Rule = { words: string[]; hex: string; fits: (c: Hsl) => boolean };

function toHsl(hex: string): Hsl | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

const inHue = (h: number, from: number, to: number) =>
  from <= to ? h >= from && h <= to : h >= from || h <= to;

const hue = (from: number, to: number) => (c: Hsl) => c.s >= 0.12 && inHue(c.h, from, to);

const RULES: Rule[] = [
  { words: ["black", "jet", "onyx"], hex: "#1F1F1F", fits: (c) => c.l < 0.25 },
  { words: ["charcoal"], hex: "#36393D", fits: (c) => c.l < 0.35 && c.s < 0.25 },
  { words: ["white", "ivory", "off-white", "snow"], hex: "#F5F5F2", fits: (c) => c.l > 0.85 },
  { words: ["cream", "ecru", "oatmeal", "bone"], hex: "#F2EAD3", fits: (c) => c.l > 0.75 },
  { words: ["beige", "sand", "stone", "khaki"], hex: "#C9B48F", fits: (c) => c.l > 0.45 && (c.s < 0.35 || inHue(c.h, 20, 80)) },
  { words: ["gray", "grey", "heather", "ash", "slate"], hex: "#8C8C8C", fits: (c) => c.s < 0.25 },
  { words: ["silver", "chrome"], hex: "#C0C0C0", fits: (c) => c.s < 0.2 && c.l > 0.5 },
  { words: ["gold", "golden"], hex: "#D4AF37", fits: hue(30, 65) },
  { words: ["burgundy", "maroon", "wine", "oxblood", "merlot"], hex: "#6D1A2A", fits: (c) => c.s >= 0.12 && inHue(c.h, 320, 25) && c.l < 0.45 },
  { words: ["red", "crimson", "scarlet", "cherry", "ruby"], hex: "#B22D2D", fits: hue(340, 20) },
  { words: ["pink", "blush", "rose", "fuchsia", "magenta", "bubblegum"], hex: "#F2A7C3", fits: hue(290, 20) },
  { words: ["coral", "peach", "salmon"], hex: "#F08A6C", fits: hue(0, 40) },
  { words: ["rust", "terracotta", "burnt"], hex: "#B7472A", fits: hue(5, 40) },
  { words: ["orange", "tangerine"], hex: "#E07A3F", fits: hue(10, 45) },
  { words: ["brown", "chocolate", "cognac", "mocha", "espresso", "coffee", "walnut"], hex: "#6B4423", fits: (c) => inHue(c.h, 0, 50) && c.l < 0.6 },
  { words: ["camel", "tan", "caramel", "taupe", "toffee"], hex: "#B8935A", fits: (c) => inHue(c.h, 15, 55) || c.s < 0.2 },
  { words: ["mustard", "yellow", "lemon", "butter", "canary"], hex: "#E9C46A", fits: hue(38, 70) },
  { words: ["olive", "army"], hex: "#6B6B3A", fits: hue(45, 110) },
  { words: ["sage"], hex: "#9CAF88", fits: (c) => c.s >= 0.08 && inHue(c.h, 60, 160) },
  { words: ["mint", "seafoam"], hex: "#A8E6CF", fits: hue(110, 175) },
  { words: ["green", "emerald", "forest", "hunter", "kelly", "jade", "moss", "pine"], hex: "#2E6B4A", fits: hue(65, 170) },
  { words: ["teal", "turquoise", "aqua", "cyan"], hex: "#2A9D8F", fits: hue(160, 200) },
  { words: ["navy", "midnight"], hex: "#1F2A44", fits: (c) => inHue(c.h, 195, 260) && c.l < 0.35 },
  { words: ["denim", "chambray"], hex: "#4A6A8A", fits: (c) => inHue(c.h, 190, 250) || c.s < 0.15 },
  { words: ["blue", "cobalt", "royal", "sky", "azure", "powder", "cornflower"], hex: "#3A6EA5", fits: hue(185, 255) },
  { words: ["indigo"], hex: "#3F3A8C", fits: hue(220, 275) },
  { words: ["purple", "violet", "plum", "eggplant", "grape"], hex: "#7B5EA7", fits: hue(255, 320) },
  { words: ["lilac", "lavender", "mauve", "orchid", "periwinkle"], hex: "#C8A2C8", fits: hue(230, 340) },
];

function colorWordsIn(name: string): { rule: Rule; position: number }[] {
  const n = name.toLowerCase();
  const found: { rule: Rule; position: number }[] = [];
  for (const rule of RULES) {
    for (const word of rule.words) {
      const match = new RegExp(`\\b${word}\\b`).exec(n);
      if (match) {
        found.push({ rule, position: match.index });
        break;
      }
    }
  }
  return found.sort((a, b) => a.position - b.position);
}

export function colorFromName(name: string): string | null {
  return colorWordsIn(name)[0]?.rule.hex ?? null;
}

export function fixColor(name: string, hex: string): string {
  const found = colorWordsIn(name);
  if (found.length === 0) return hex;

  const color = toHsl(hex);
  if (color && found.some(({ rule }) => rule.fits(color))) return hex;

  return found[0].rule.hex;
}

export function fixWardrobe(wardrobe: Wardrobe): Wardrobe {
  const fixed = {} as Wardrobe;
  for (const slot of Object.keys(wardrobe) as (keyof Wardrobe)[]) {
    fixed[slot] = wardrobe[slot].map((piece) => ({ ...piece, color: fixColor(piece.name, piece.color) }));
  }
  return fixed;
}