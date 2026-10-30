import { Inter, Playfair_Display, Space_Grotesk, Cinzel, Quicksand } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });

export const fonts = { inter, playfair, spaceGrotesk, cinzel, quicksand };

export type Wardrobe = {
  tops: Piece[];
  bottoms: Piece[];
  outerwear: Piece[];
  shoes: Piece[];
  accessories: Piece[];
};

export type Piece = { name: string; color: string; slot?: keyof Wardrobe };

export type Theme = {
  background: string;
  text: string;
  accent: string;
  palette: string[];
  fontClass: string;
  items: string[];
  searches: string[];
  wardrobe: Wardrobe;
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
  searches: ["minimal neutral outfit", "casual chic street style", "simple everyday outfit"],
  wardrobe: {
    tops: [
      { name: "White fitted tee", color: "#F5F5F0" },
      { name: "Cream knit sweater", color: "#E8DCC8" },
    ],
    bottoms: [
      { name: "Straight-leg jeans", color: "#4A5A6A" },
      { name: "Black midi skirt", color: "#1F1F1F" },
    ],
    outerwear: [
      { name: "Camel trench coat", color: "#B8935A" },
      { name: "Black leather jacket", color: "#2A2A2A" },
    ],
    shoes: [
      { name: "White sneakers", color: "#F0F0F0" },
      { name: "Brown ankle boots", color: "#6B4423" },
    ],
    accessories: [
      { name: "Gold hoop earrings", color: "#D4AF37" },
      { name: "Tan crossbody bag", color: "#C19A6B" },
    ],
  },
};