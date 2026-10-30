import type { Piece, Wardrobe } from "./themes";

type Slot = keyof Wardrobe;
type Pt = [number, number];

const SEE_THROUGH = /(clear|transparent|mesh|sheer|lace|tulle|organza|chiffon)/;

const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y]);
const toPoints = (pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");
const lower = (piece: Piece) => piece.name.toLowerCase();

export function guessSlot(name: string): Slot {
  const n = name.toLowerCase();
  if (/(boot|shoe|sneaker|heel|loafer|sandal|mule|oxford|pump|clog|slipper|flats\b)/.test(n)) return "shoes";
  if (/(coat|jacket|blazer|cardigan|trench|bomber|parka|shrug|vest|gilet|kimono)/.test(n)) return "outerwear";
  if (/(pant|trouser|jean|shorts|skirt|legging|jogger|slack|chino|culotte)/.test(n)) return "bottoms";
  if (
    /(belt|bag|backpack|purse|tote|clutch|hat\b|cap\b|beanie|beret|earring|necklace|bracelet|\bring|watch|scarf|glasses|clip|headband|bow\b|choker|pendant|glove|sock|tights|scrunchie)/.test(n)
  )
    return "accessories";
  return "tops";
}

function paint(piece: Piece, outline: string) {
  return {
    fill: piece.color,
    fillOpacity: SEE_THROUGH.test(lower(piece)) ? 0.5 : 1,
    stroke: outline,
    strokeOpacity: 0.35,
    strokeWidth: 1.2,
    strokeLinejoin: "round" as const,
  };
}

function Poly({ pts, piece, outline }: { pts: Pt[]; piece: Piece; outline: string }) {
  return (
    <polygon points={toPoints(pts)} {...paint(piece, outline)}>
      <title>{piece.name}</title>
    </polygon>
  );
}

// ---------- Shapes ----------

const LONG_SLEEVE: Pt[] = [[60, 62], [74, 72], [54, 178], [36, 172]];
const SHORT_SLEEVE: Pt[] = [[60, 62], [74, 72], [68, 100], [50, 94]];
const OUTER_SLEEVE: Pt[] = [[57, 58], [77, 69], [57, 182], [33, 175]];

const PANTS: Pt[] = [[70, 148], [130, 148], [132, 176], [126, 322], [103, 322], [100, 192], [97, 322], [74, 322], [68, 176]];
const WIDE_PANTS: Pt[] = [[70, 148], [130, 148], [134, 176], [138, 322], [103, 322], [100, 192], [97, 322], [62, 322], [66, 176]];
const SHORTS: Pt[] = [[70, 148], [130, 148], [134, 212], [103, 212], [100, 190], [97, 212], [66, 212]];

function sleeveType(n: string): "none" | "short" | "long" {
  if (/(tank|cami|tube|strapless|bandeau|halter|corset|bustier|sleeveless)/.test(n)) return "none";
  if (/(tee|t-shirt|short-sleeve|short sleeve|polo|puff)/.test(n)) return "short";
  return "long";
}

function lengthFrom(n: string, mini: number, midi: number, maxi: number, normal: number) {
  if (/mini/.test(n)) return mini;
  if (/midi/.test(n)) return midi;
  if (/(maxi|floor)/.test(n)) return maxi;
  return normal;
}

function Sleeves({ piece, outline }: { piece: Piece; outline: string }) {
  const type = sleeveType(lower(piece));
  if (type === "none") return null;
  const sleeve = type === "short" ? SHORT_SLEEVE : LONG_SLEEVE;
  return (
    <>
      <Poly pts={sleeve} piece={piece} outline={outline} />
      <Poly pts={mirror(sleeve)} piece={piece} outline={outline} />
    </>
  );
}

function TopBody({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  const hem = /crop/.test(n) ? 128 : 160;
  const pts: Pt[] =
    sleeveType(n) === "none"
      ? [[72, 64], [128, 64], [130, hem], [70, hem]]
      : [[62, 62], [138, 62], [132, hem], [68, hem]];
  return <Poly pts={pts} piece={piece} outline={outline} />;
}

function Top({ piece, outline }: { piece: Piece; outline: string }) {
  return (
    <>
      <Sleeves piece={piece} outline={outline} />
      <TopBody piece={piece} outline={outline} />
    </>
  );
}

function Bottom({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  if (/short/.test(n)) return <Poly pts={SHORTS} piece={piece} outline={outline} />;
  if (/skirt/.test(n)) {
    const hem = lengthFrom(n, 205, 262, 312, 232);
    return <Poly pts={[[74, 148], [126, 148], [140, hem], [60, hem]]} piece={piece} outline={outline} />;
  }
  const pants = /(wide|flare|palazzo|bell)/.test(n) ? WIDE_PANTS : PANTS;
  return <Poly pts={pants} piece={piece} outline={outline} />;
}

function OnePiece({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  if (/(jumpsuit|overall)/.test(n)) {
    return (
      <>
        <Bottom piece={{ ...piece, name: "pants" }} outline={outline} />
        <Top piece={piece} outline={outline} />
      </>
    );
  }
  if (/(romper|playsuit)/.test(n)) {
    return (
      <>
        <Poly pts={SHORTS} piece={piece} outline={outline} />
        <Top piece={piece} outline={outline} />
      </>
    );
  }
  const hem = lengthFrom(n, 212, 262, 314, 245);
  return (
    <>
      <Sleeves piece={piece} outline={outline} />
      <Poly
        pts={[[64, 62], [136, 62], [128, 148], [142, hem], [58, hem], [72, 148]]}
        piece={piece}
        outline={outline}
      />
    </>
  );
}

function Shoes({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  if (/boot/.test(n)) {
    const top = /(knee|thigh|tall|over-the)/.test(n) ? 225 : 282;
    const boot: Pt[] = [[73, top], [99, top], [100, 320], [103, 331], [67, 331], [71, 320]];
    return (
      <>
        <Poly pts={boot} piece={piece} outline={outline} />
        <Poly pts={mirror(boot)} piece={piece} outline={outline} />
      </>
    );
  }
  return (
    <>
      <rect x={67} y={317} width={33} height={14} rx={6} {...paint(piece, outline)}>
        <title>{piece.name}</title>
      </rect>
      <rect x={100} y={317} width={33} height={14} rx={6} {...paint(piece, outline)}>
        <title>{piece.name}</title>
      </rect>
    </>
  );
}

function outerHem(n: string) {
  if (/(coat|trench|parka|duster|longline|maxi)/.test(n)) return 268;
  if (/(crop|bolero|shrug)/.test(n)) return 132;
  if (/(vest|gilet)/.test(n)) return 166;
  return 174;
}

function Outerwear({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  const hem = outerHem(n);
  const sleeveless = /(vest|gilet)/.test(n);
  const panel: Pt[] = [[58, 58], [97, 58], [95, hem], [hem > 200 ? 50 : 56, hem]];
  return (
    <>
      {!sleeveless && (
        <>
          <Poly pts={OUTER_SLEEVE} piece={piece} outline={outline} />
          <Poly pts={mirror(OUTER_SLEEVE)} piece={piece} outline={outline} />
        </>
      )}
      <Poly pts={panel} piece={piece} outline={outline} />
      <Poly pts={mirror(panel)} piece={piece} outline={outline} />
    </>
  );
}

// ---------- Accessories ----------

type AccessoryKind =
  | "belt" | "backpack" | "bag" | "hat" | "hair" | "glasses" | "earrings"
  | "scarf" | "necklace" | "gloves" | "wrist" | "socks" | "tights" | "other";

function accessoryKind(n: string): AccessoryKind {
  if (/belt/.test(n)) return "belt";
  if (/backpack/.test(n)) return "backpack";
  if (/(bag|purse|tote|clutch|satchel|pouch)/.test(n)) return "bag";
  if (/(hat\b|cap\b|beanie|beret|fedora|bucket)/.test(n)) return "hat";
  if (/(hair|clip|headband|bow\b|scrunchie|barrette|tiara)/.test(n)) return "hair";
  if (/(glasses|shades)/.test(n)) return "glasses";
  if (/(earring|hoop|stud)/.test(n)) return "earrings";
  if (/scarf/.test(n)) return "scarf";
  if (/(necklace|pendant|choker|chain|pearl)/.test(n)) return "necklace";
  if (/glove/.test(n)) return "gloves";
  if (/(watch|bracelet|bangle|cuff|\bring)/.test(n)) return "wrist";
  if (/sock/.test(n)) return "socks";
  if (/(tights|stocking)/.test(n)) return "tights";
  return "other";
}

function Accessory({ piece, outline }: { piece: Piece; outline: string }) {
  const n = lower(piece);
  const style = paint(piece, outline);
  const title = <title>{piece.name}</title>;

  switch (accessoryKind(n)) {
    case "belt":
      return <rect x={68} y={146} width={64} height={8} rx={2} {...style}>{title}</rect>;
    case "backpack":
      return (
        <>
          <rect x={77} y={62} width={7} height={62} rx={3} {...style}>{title}</rect>
          <rect x={116} y={62} width={7} height={62} rx={3} {...style}>{title}</rect>
        </>
      );
    case "bag":
      return (
        <>
          <line x1={130} y1={64} x2={72} y2={152} stroke={piece.color} strokeWidth={3} />
          <rect x={54} y={150} width={30} height={24} rx={5} {...style}>{title}</rect>
        </>
      );
    case "hat":
      if (/(beanie|beret)/.test(n)) {
        return <path d="M81,30 A19,19 0 0 1 119,30 Z" {...style}>{title}</path>;
      }
      return (
        <>
          <polygon points={toPoints([[83, 28], [86, 8], [114, 8], [117, 28]])} {...style}>{title}</polygon>
          <ellipse cx={100} cy={29} rx={28} ry={5} {...style}>{title}</ellipse>
        </>
      );
    case "hair":
      return (
        <>
          <rect x={83} y={15} width={11} height={5} rx={2} {...style}>{title}</rect>
          <rect x={106} y={15} width={11} height={5} rx={2} {...style}>{title}</rect>
        </>
      );
    case "glasses":
      return (
        <>
          <circle cx={93} cy={31} r={5.5} {...style}>{title}</circle>
          <circle cx={107} cy={31} r={5.5} {...style}>{title}</circle>
          <line x1={98} y1={31} x2={102} y2={31} stroke={piece.color} strokeWidth={2} />
        </>
      );
    case "earrings":
      if (/hoop/.test(n)) {
        return (
          <>
            <circle cx={82} cy={41} r={4} fill="none" stroke={piece.color} strokeWidth={2}>{title}</circle>
            <circle cx={118} cy={41} r={4} fill="none" stroke={piece.color} strokeWidth={2}>{title}</circle>
          </>
        );
      }
      return (
        <>
          <circle cx={82} cy={40} r={3} {...style}>{title}</circle>
          <circle cx={118} cy={40} r={3} {...style}>{title}</circle>
        </>
      );
    case "scarf":
      return (
        <>
          <rect x={84} y={50} width={32} height={13} rx={6} {...style}>{title}</rect>
          <rect x={104} y={58} width={10} height={42} rx={3} {...style}>{title}</rect>
        </>
      );
    case "necklace":
      return (
        <>
          <path d="M86,62 Q100,86 114,62" fill="none" stroke={piece.color} strokeWidth={3}>{title}</path>
          {/pendant/.test(n) && <circle cx={100} cy={77} r={3} {...style} />}
        </>
      );
    case "gloves":
      return (
        <>
          <circle cx={45} cy={180} r={8} {...style}>{title}</circle>
          <circle cx={155} cy={180} r={8} {...style}>{title}</circle>
        </>
      );
    case "wrist":
      return <rect x={37} y={163} width={16} height={6} rx={2} {...style}>{title}</rect>;
    default:
      return null;
  }
}

function UnderLayer({ piece, outline }: { piece: Piece; outline: string }) {
  const kind = accessoryKind(lower(piece));
  if (kind === "tights") {
    const leg: Pt[] = [[72, 174], [99, 174], [97, 320], [79, 320]];
    return (
      <>
        <Poly pts={leg} piece={piece} outline={outline} />
        <Poly pts={mirror(leg)} piece={piece} outline={outline} />
      </>
    );
  }
  if (kind === "socks") {
    return (
      <>
        <rect x={76} y={298} width={22} height={24} rx={3} {...paint(piece, outline)} />
        <rect x={102} y={298} width={22} height={24} rx={3} {...paint(piece, outline)} />
      </>
    );
  }
  return null;
}

// ---------- The whole figure ----------

type Props = { pieces: Piece[]; outline: string };

export default function OutfitPreview({ pieces, outline }: Props) {
  const all = pieces.map((piece) => ({ ...piece, slot: piece.slot ?? guessSlot(piece.name) }));
  const inSlot = (slot: Slot) => all.filter((piece) => piece.slot === slot);

  const tops = inSlot("tops");
  const onePieces = tops.filter((p) => /(dress|jumpsuit|romper|playsuit|overall)/.test(lower(p)));
  const regularTops = tops.filter((p) => !onePieces.includes(p));
  const bottoms = inSlot("bottoms");
  const shoes = inSlot("shoes");
  const outerwear = [...inSlot("outerwear")].sort((a, b) => outerHem(lower(b)) - outerHem(lower(a)));
  const accessories = inSlot("accessories");
  const underLayers = accessories.filter((p) => ["socks", "tights"].includes(accessoryKind(lower(p))));
  const belts = accessories.filter((p) => accessoryKind(lower(p)) === "belt");
  const topAccessories = accessories.filter(
    (p) => !["socks", "tights", "belt", "other"].includes(accessoryKind(lower(p)))
  );
  const extras = accessories.filter((p) => accessoryKind(lower(p)) === "other");

  const body = { fill: outline, fillOpacity: 0.12 };
  const leg: Pt[] = [[72, 174], [99, 174], [97, 320], [79, 320]];

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 340"
        className="h-auto w-full max-w-[220px]"
        role="img"
        aria-label={`Sketch of an outfit with ${pieces.map((p) => p.name).join(", ")}`}
      >
        {/* Figure */}
        <circle cx={100} cy={32} r={17} {...body} />
        <rect x={93} y={47} width={14} height={16} {...body} />
        <polygon points={toPoints([[64, 62], [136, 62], [128, 150], [130, 176], [70, 176], [72, 150]])} {...body} />
        <polygon points={toPoints(LONG_SLEEVE)} {...body} />
        <polygon points={toPoints(mirror(LONG_SLEEVE))} {...body} />
        <circle cx={45} cy={181} r={7} {...body} />
        <circle cx={155} cy={181} r={7} {...body} />
        <polygon points={toPoints(leg)} {...body} />
        <polygon points={toPoints(mirror(leg))} {...body} />

        {/* Clothes, drawn from the inside out */}
        {underLayers.map((p) => <UnderLayer key={p.name} piece={p} outline={outline} />)}
        {regularTops.map((p) => <Top key={p.name} piece={p} outline={outline} />)}
        {bottoms.map((p) => <Bottom key={p.name} piece={p} outline={outline} />)}
        {onePieces.map((p) => <OnePiece key={p.name} piece={p} outline={outline} />)}
        {belts.map((p) => <Accessory key={p.name} piece={p} outline={outline} />)}
        {shoes.map((p) => <Shoes key={p.name} piece={p} outline={outline} />)}
        {outerwear.map((p) => <Outerwear key={p.name} piece={p} outline={outline} />)}
        {topAccessories.map((p) => <Accessory key={p.name} piece={p} outline={outline} />)}
      </svg>

      {extras.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {extras.map((p) => (
            <span key={p.name} className="flex items-center gap-1 text-xs">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: p.color, borderColor: outline }}
              />
              {p.name}
            </span>
          ))}
        </div>
      )}
      <p className="mt-1 text-[10px] opacity-60">A sketch of your picks, not the exact garments</p>
    </div>
  );
}