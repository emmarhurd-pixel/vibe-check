import { Playfair_Display, Space_Grotesk, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

export type Theme = {
  background: string;
  text: string;
  accent: string;
  palette: string[];
  fontClass: string;
  items: string[];
};

export const themes: Record<string, Theme> = {
  hadestown: {
    background: "#2B1B17",
    text: "#E8D5B5",
    accent: "#D9A441",
    palette: ["#2B1B17", "#7A2E1F", "#C1440E", "#D9A441", "#E8D5B5"],
    fontClass: playfair.className,
    items: [
      "Rust, burgundy, or olive slip dress or flowy skirt",
      "Worn leather or suede jacket",
      "Gold or brass jewelry",
      "Ankle boots or heeled Mary Janes",
      "A flower detail as a nod to Persephone",
    ],
  },
  concert: {
    background: "#0D0221",
    text: "#F5F5F5",
    accent: "#FF2E88",
    palette: ["#0D0221", "#3A0CA3", "#FF2E88", "#00F5D4", "#F5F5F5"],
    fontClass: spaceGrotesk.className,
    items: [
      "Comfy platform boots or sneakers you can stand in for hours",
      "Statement jacket or graphic top",
      "Small crossbody bag",
      "Glitter, gems, or bold makeup",
      "A light layer you can tie around your waist",
    ],
  },
  default: {
    background: "#FAF7F2",
    text: "#2D2D2D",
    accent: "#8B5E3C",
    palette: ["#FAF7F2", "#E4D5C3", "#B89A7A", "#8B5E3C", "#2D2D2D"],
    fontClass: inter.className,
    items: [
      "A versatile top in a neutral tone",
      "Well-fitted bottoms",
      "Comfortable shoes",
      "One statement accessory",
    ],
  },
};

export function pickTheme(type?: string, name?: string): Theme {
  const eventName = (name ?? "").toLowerCase();
  if (eventName.includes("hadestown")) return themes.hadestown;
  if (type === "Concert") return themes.concert;
  return themes.default;
}