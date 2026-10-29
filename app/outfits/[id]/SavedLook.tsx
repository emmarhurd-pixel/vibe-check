"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOutfit, type SavedOutfit } from "../../saved-outfits";
import { formatDate, sortLightToDark, sortPiecesLightToDark } from "../../format";

function pinterestSearchUrl(query: string) {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
}

export default function SavedLook() {
  const { id } = useParams<{ id: string }>();
  const [outfit, setOutfit] = useState<SavedOutfit | null | undefined>(undefined);

  useEffect(() => {
    getOutfit(id).then(setOutfit);
  }, [id]);

  if (outfit === undefined) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (outfit === null) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Couldn&apos;t find that outfit</h1>
        <p className="mt-2 text-sm text-gray-500">
          It may have been deleted, or it&apos;s saved on a different device or account.
        </p>
        <Link href="/outfits" className="mt-6 inline-block underline">
          ← My outfits
        </Link>
      </main>
    );
  }

  const palette = sortLightToDark(outfit.palette);
  const outfitColors = sortPiecesLightToDark(outfit.pieces);

  const rebuild = new URLSearchParams();
  for (const [key, value] of Object.entries({
    type: outfit.eventType,
    name: outfit.eventName,
    date: outfit.date,
    city: outfit.city,
    venue: outfit.venue,
    style: outfit.style,
    vibe: outfit.vibe,
  })) {
    if (value) rebuild.set(key, value);
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: outfit.background, color: outfit.text }}
    >
      <main className="mx-auto max-w-md p-6">
        <Link href="/outfits" className="text-sm underline">
          ← My outfits
        </Link>

        <h1 className="mt-4 text-4xl font-bold" style={{ color: outfit.accent }}>
          {outfit.eventName}
        </h1>
        <p className="mt-2 opacity-80">
          {[outfit.eventType, outfit.city, formatDate(outfit.date), outfit.venue]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {palette.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-semibold">Color palette</h2>
            <div
              className="mt-3 flex overflow-hidden rounded-lg border"
              style={{ borderColor: outfit.text }}
            >
              {palette.map((color) => (
                <div
                  key={color}
                  className="h-16 flex-1"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-1 flex">
              {palette.map((color) => (
                <span key={color} className="flex-1 text-center text-[10px] uppercase opacity-70">
                  {color}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 rounded-lg border-2 p-4" style={{ borderColor: outfit.accent }}>
          <h2 className="text-lg font-semibold">Your outfit</h2>
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
            {outfit.pieces.map((piece) => (
              <li key={piece.name} className="flex items-center justify-between gap-3">
                <span>{piece.name}</span>
                <a
                  href={pinterestSearchUrl(piece.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 underline"
                  style={{ color: outfit.accent }}
                >
                  Pinterest ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        {outfit.items.length > 0 && (
          <>
            <h2 className="mt-8 text-xl font-semibold">Outfit checklist</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {outfit.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {outfit.searches.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium">See more on Pinterest</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {outfit.searches.map((search) => (
                <a
                  key={search}
                  href={pinterestSearchUrl(search)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border px-3 py-1 text-sm"
                  style={{ borderColor: outfit.accent, color: outfit.accent }}
                >
                  {search} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={`/results?${rebuild}`}
            className="rounded-full border-2 px-4 py-2 font-medium"
            style={{ borderColor: outfit.accent, color: outfit.accent }}
          >
            ↻ Rebuild this look
          </Link>
          <Link href="/" className="underline">
            New event
          </Link>
        </div>
      </main>
    </div>
  );
}