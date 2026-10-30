import type { Piece, Wardrobe } from "./themes";
import { guessSlot } from "./closet";
import { colorDistance, lightness, SAME_COLOR_DISTANCE } from "./format";

type Slot = keyof Wardrobe;

const BASE_WEIGHT: Record<Slot, number> = {
  outerwear: 30,
  bottoms: 26,
  tops: 22,
  shoes: 10,
  accessories: 5,
};

function weightOf(piece: Piece): number {
  const slot = piece.slot ?? guessSlot(piece.name);
  const n = piece.name.toLowerCase();
  if (slot === "tops" && /(dress|jumpsuit|romper|overall)/.test(n)) return 45;
  if (slot === "outerwear" && /(coat|trench|parka|duster|longline)/.test(n)) return 36;
  if (slot === "outerwear" && /(vest|gilet|crop|bolero|shrug)/.test(n)) return 16;
  if (slot === "accessories" && /(bag|backpack|tote|scarf)/.test(n)) return 8;
  return BASE_WEIGHT[slot];
}

type Group = { color: string; names: string[]; weight: number };

function buildStory(pieces: Piece[]): Group[] {
  const groups: Group[] = [];
  for (const piece of pieces) {
    const weight = weightOf(piece);
    const match = groups.find((g) => colorDistance(g.color, piece.color) < SAME_COLOR_DISTANCE);
    if (match) {
      match.names.push(piece.name);
      match.weight += weight;
    } else {
      groups.push({ color: piece.color, names: [piece.name], weight });
    }
  }
  return groups.sort((a, b) => lightness(b.color) - lightness(a.color));
}

type Props = { pieces: Piece[]; text: string; compact?: boolean };

export default function ColorStory({ pieces, text, compact = false }: Props) {
  const groups = buildStory(pieces);
  if (groups.length === 0) return null;

  const total = groups.reduce((sum, g) => sum + g.weight, 0);
  const hairline = `color-mix(in srgb, ${text} 20%, transparent)`;

  const band = (
    <div
      className={`flex overflow-hidden ${compact ? "h-8 rounded-md" : "h-28 rounded-lg"}`}
      style={{ border: `1px solid ${hairline}` }}
    >
      {groups.map((g) => (
        <div
          key={g.color}
          title={g.names.join(", ")}
          style={{ flexGrow: g.weight, flexBasis: 0, minWidth: 6, backgroundColor: g.color }}
        />
      ))}
    </div>
  );

  if (compact) return band;

  return (
    <figure>
      <figcaption className="text-[10px] uppercase tracking-[0.25em] opacity-60">Color story</figcaption>
      <div className="mt-3">{band}</div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {groups.map((g) => (
          <li
            key={g.color}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest"
            title={g.names.join(", ")}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: g.color, border: `1px solid ${hairline}` }}
            />
            <span className="opacity-70">{g.color}</span>
            <span className="opacity-50">{Math.round((g.weight / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}