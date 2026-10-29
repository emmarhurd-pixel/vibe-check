"use client";

import { useState } from "react";
import Link from "next/link";
import type { Piece, Wardrobe } from "../themes";
import { saveOutfit } from "../saved-outfits";
import { sortPiecesLightToDark } from "../format";

type Slot = { key: keyof Wardrobe; label: string; multiple: boolean };

const slots: Slot[] = [
  { key: "tops", label: "Tops", multiple: true },
  { key: "bottoms", label: "Bottoms", multiple: false },
  { key: "outerwear", label: "Outerwear", multiple: true },
  { key: "shoes", label: "Shoes", multiple: false },
  { key: "accessories", label: "Accessories", multiple: true },
];

type Props = {
  wardrobe: Wardrobe;
  accent: string;
  text: string;
  background: string;
  headingClass: string;
  event: {
    name: string;
    type: string;
    date: string;
    city: string;
    venue: string;
    style: string;
    vibe: string;
  };
  look: { palette: string[]; items: string[]; searches: string[] };
};

function pinterestSearchUrl(query: string) {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
}

export default function OutfitBuilder({ wardrobe, accent, text, background, headingClass, event, look }: Props) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  function toggle(slot: Slot, name: string) {
    setSaved(false);
    setPicked((current) => {
      const chosen = current[slot.key] ?? [];
      let next: string[];
      if (chosen.includes(name)) {
        next = chosen.filter((n) => n !== name);
      } else {
        next = slot.multiple ? [...chosen, name] : [name];
      }
      return { ...current, [slot.key]: next };
    });
  }

  function clear() {
    setPicked({});
    setSaved(false);
  }

  const outfit: Piece[] = slots.flatMap((slot) =>
    (wardrobe[slot.key] ?? []).filter((piece) => picked[slot.key]?.includes(piece.name))
  );
  const outfitColors = sortPiecesLightToDark(outfit);

  async function handleSave() {
    try {
      await saveOutfit({
        eventName: event.name,
        eventType: event.type,
        date: event.date,
        city: event.city,
        venue: event.venue,
        style: event.style,
        vibe: event.vibe,
        accent,
        background,
        text,
        pieces: outfit,
        palette: look.palette,
        items: look.items,
        searches: look.searches,
      });
      setSaved(true);
    } catch (error) {
      console.error(error);
      window.alert("Couldn't save that outfit. Please try again.");
    }
  }

  const faintBorder = `color-mix(in srgb, ${text} 25%, transparent)`;

  return (
    <section>
      <h2 className={`mt-8 text-xl font-semibold ${headingClass}`}>Build your outfit</h2>
      <p className="mt-1 text-sm opacity-80">
        Tap pieces to mix and match. Tops, outerwear, and accessories can be layered.
      </p>

      {slots.map((slot) => (
        <div key={slot.key} className="mt-5">
          <h3 className="font-medium">
            {slot.label}
            <span className="ml-2 text-xs opacity-70">{slot.multiple ? "pick any" : "pick one"}</span>
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(wardrobe[slot.key] ?? []).map((piece) => {
              const isPicked = picked[slot.key]?.includes(piece.name) ?? false;
              return (
                <button
                  key={piece.name}
                  type="button"
                  onClick={() => toggle(slot, piece.name)}
                  aria-pressed={isPicked}
                  className="flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm"
                  style={{ borderColor: isPicked ? accent : faintBorder }}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border"
                    style={{ backgroundColor: piece.color, borderColor: faintBorder }}
                  />
                  <span>{piece.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-8 rounded-lg border-2 p-4" style={{ borderColor: accent }}>
        <h3 className={`text-lg font-semibold ${headingClass}`}>Your outfit</h3>
        {outfit.length === 0 ? (
          <p className="mt-2 text-sm opacity-80">Nothing picked yet.</p>
        ) : (
          <>
            <div className="mt-3 flex h-10 overflow-hidden rounded-md">
              {outfitColors.map((piece) => (
                <div
                  key={piece.name}
                  className="flex-1"
                  style={{ backgroundColor: piece.color }}
                  title={piece.name}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {outfit.map((piece) => (
                <li key={piece.name} className="flex items-center justify-between gap-3">
                  <span>{piece.name}</span>
                  <a
                    href={pinterestSearchUrl(piece.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 underline"
                    style={{ color: accent }}
                  >
                    Pinterest ↗
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: accent, color: background }}
              >
                {saved ? "Saved ✓" : "Save outfit"}
              </button>
              {saved && (
                <Link href="/outfits" className="text-sm underline">
                  View my outfits →
                </Link>
              )}
              <button type="button" onClick={clear} className="text-sm underline">
                Clear outfit
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}