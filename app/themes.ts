import { Inter, Playfair_Display, Space_Grotesk, Cinzel, Quicksand } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });

export const fonts = { inter, playfair, spaceGrotesk, cinzel, quicksand };

export type Theme = {
  background: string;
  text: string;
  accent: string;
  palette: string[];
  fontClass: string;
  items: string[];
};

export const defaultTheme: Theme = {
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
};