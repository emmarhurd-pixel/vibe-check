"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCloset, SLOTS, type ClosetItem } from "../closet";
import { saveOutfit } from "../saved-outfits";
import { formatDate, uniquePieceColors } from "../format";
import type { Piece } from "../themes";
import type { Weather } from "../weather";
import ColorStory from "../ColorStory";
import LoadingLook from "../results/LoadingLook";

type Look = { pieceIds: string[]; reason: string };
type Result = {
  weather: Weather | null;
  background: string;
  text: string;
  accent: string;
  looks: Look[];
  source: "ai" | "backup";
};

const slotLabel = (slot: string) => SLOTS.find((s) => s.key === slot)?.label ?? slot;

export default function ClosetOutfit() {
  const params = useSearchParams();
  const name = params.get("name") ?? "Casual day";
  const date = params.get("date") ?? "";
  const city = params.get("city") ?? "";
  const style = params.get("style") ?? "";
  const vibe = params.get("vibe") ?? "";
  const plans = name.replace(/^Casual day:?\s*/, "");

  const [closet, setCloset] = useState<ClosetItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(0);
  const [savedLooks, setSavedLooks] = useState<number[]>([]);

  useEffect(() => {
    getCloset().then(setCloset);
  }, []);

  useEffect(() => {
    if (!closet || closet.length === 0) return;
    let cancelled = false;

    fetch("/api/closet-outfit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        date,
        city,
        style,
        vibe,
        attempt: round,
        closet: closet.map((item) => ({
          id: item.id,
          name: item.name,
          slot: item.slot,
          color: item.color,
          tags: item.tags,
        })),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Result) => {
        if (!cancelled) setResult(data);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [closet, round, name, date, city, style, vibe]);

  function newRound() {
    setResult(null);
    setFailed(false);
    setSelected(0);
    setSavedLooks([]);
    setRound((r) => r + 1);
  }

  if (closet === null) return <LoadingLook />;

  if (closet.length === 0) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-3xl font-bold">Your closet is empty</h1>
        <p className="mt-2 text-sm text-gray-500">
          Add the pieces you own first, then come back for today&apos;s outfit.
        </p>
        <Link href="/closet" className="mt-6 inline-block underline">
          Go to My closet →
        </Link>
      </main>
    );
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">We couldn&apos;t build an outfit just now.</p>
        <div className="mt-6 flex gap-4">
          <button type="button" onClick={newRound} className="underline">
            Try again
          </button>
          <Link href="/" className="underline">
            ← Start over
          </Link>
        </div>
      </main>
    );
  }

  if (!result) return <LoadingLook />;

  const byId = new Map(closet.map((item) => [item.id, item]));
  const looks = result.looks.map((look) => ({
    reason: look.reason,
    pieces: look.pieceIds
      .map((id) => byId.get(id))
      .filter((item): item is ClosetItem => Boolean(item))
      .map((item): Piece => ({ name: item.name, color: item.color, slot: item.slot })),
  }));

  const look = looks[selected] ?? looks[0];
  const { background, text, accent, weather } = result;
  const faintBorder = `color-mix(in srgb, ${text} 25%, transparent)`;

  async function handleSave() {
    try {
      await saveOutfit({
        eventName: name,
        eventType: "Casual day",
        date,
        city,
        venue: "",
        style,
        vibe,
        accent,
        background,
        text,
        pieces: look.pieces,
        palette: uniquePieceColors(look.pieces).map((g) => g.color),
        items: [],
        searches: [],
      });
      setSavedLooks((s) => [...s, selected]);
    } catch (error) {
      console.error(error);
      window.alert("Couldn't save that outfit. Please try again.");
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: background, color: text }}>
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-4xl font-bold" style={{ color: accent }}>
          Today&apos;s outfit
        </h1>
        <p className="mt-2 opacity-80">{[city, formatDate(date)].filter(Boolean).join(" · ")}</p>
        {plans && <p className="mt-1 text-sm opacity-80">Plans: {plans}</p>}

        {weather && (
          <div className="mt-6 rounded-lg border p-4" style={{ borderColor: text }}>
            <p className="font-semibold">
              {weather.description}, {weather.high}° / {weather.low}°F
            </p>
            <p className="mt-1 text-sm opacity-80">
              {weather.isForecast
                ? `Forecast${weather.rainChance != null ? ` · ${weather.rainChance}% chance of rain` : ""}`
                : "Too far out for a forecast, so this is last year's weather on the same date"}
            </p>
          </div>
        )}

        {result.source === "backup" && (
          <p className="mt-4 text-sm opacity-80">
            The AI stylist was busy, so these picks came from our backup stylist.
          </p>
        )}

        {looks.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {looks.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className="rounded-full border-2 px-4 py-1.5 text-sm font-medium"
                style={{
                  borderColor: selected === i ? accent : faintBorder,
                  color: selected === i ? accent : text,
                }}
              >
                {i === 0 ? "Best pick" : `Option ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-lg border-2 p-4" style={{ borderColor: accent }}>
          <h2 className="text-lg font-semibold">Your outfit</h2>
          {look.reason && <p className="mt-2 text-sm italic opacity-90">{look.reason}</p>}

          <div className="mt-4">
            <ColorStory pieces={look.pieces} text={text} />
          </div>

          <ul className="mt-5 space-y-2 text-sm">
            {look.pieces.map((piece) => (
              <li key={piece.name} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border"
                  style={{ backgroundColor: piece.color, borderColor: faintBorder }}
                />
                <span className="flex-1">{piece.name}</span>
                <span className="text-xs uppercase tracking-widest opacity-50">
                  {slotLabel(piece.slot ?? "")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={savedLooks.includes(selected)}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: accent, color: background }}
            >
              {savedLooks.includes(selected) ? "Saved ✓" : "Save outfit"}
            </button>
            {savedLooks.includes(selected) && (
              <Link href="/outfits" className="text-sm underline">
                View my outfits →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={newRound}
            className="rounded-full border-2 px-4 py-2 font-medium"
            style={{ borderColor: accent, color: accent }}
          >
            ↻ Shuffle
          </button>
          <Link href="/closet" className="underline">
            Edit my closet
          </Link>
          <Link href="/" className="underline">
            ← Start over
          </Link>
        </div>
      </main>
    </div>
  );
}