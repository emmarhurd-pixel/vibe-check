"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { brandColors } from "./brand";
import { getCloset } from "./closet";

const eventTypes = [
  "Concert",
  "Musical / Theater",
  "Wedding",
  "Party",
  "Festival",
  "Formal / Gala",
  "Date night",
  "Other",
];

const inputStyle = "rounded-lg border border-gray-400 bg-transparent p-3";

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function Home() {
  const [mode, setMode] = useState<"event" | "everyday">("event");
  const [closetCount, setClosetCount] = useState<number | null>(null);
  const [useCloset, setUseCloset] = useState(true);
  const [plans, setPlans] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(todayString());
    getCloset().then((items) => setClosetCount(items.length));
  }, []);

  const closetReady = (closetCount ?? 0) > 0;
  const goToCloset = mode === "everyday" && useCloset && closetReady;
  const trimmedPlans = plans.trim();

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex gap-1.5">
        {brandColors.map((color) => (
          <span key={color} className="h-3 flex-1 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-gray-400 p-1 text-sm font-medium">
        {(["event", "everyday"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-md py-2 ${mode === m ? "bg-foreground text-background" : ""}`}
          >
            {m === "event" ? "An event" : "Everyday"}
          </button>
        ))}
      </div>

      <h1 className="mt-6 text-3xl font-bold">
        {mode === "event" ? "What are you dressing for?" : "What's today looking like?"}
      </h1>
      <p className="mt-2 text-gray-500">
        {mode === "event"
          ? "Tell us about your event and we'll build the vibe."
          : "We'll check the weather and put together an outfit for your day."}
      </p>

      <Form action={goToCloset ? "/closet-outfit" : "/results"} className="mt-8 flex flex-col gap-5">
        {mode === "event" ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Type of event</span>
              <select name="type" required className={inputStyle}>
                <option value="">Choose one</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Event name</span>
              <input
                name="name"
                required
                placeholder="e.g. Stray Kids concert, Hadestown"
                className={inputStyle}
              />
            </label>
          </>
        ) : (
          <>
            <input type="hidden" name="type" value="Casual day" />
            <input
              type="hidden"
              name="name"
              value={trimmedPlans ? `Casual day: ${trimmedPlans}` : "Casual day"}
            />
            <input type="hidden" name="venue" value="indoor and outdoor" />

            <label className="flex flex-col gap-1">
              <span className="font-medium">
                Plans <span className="text-sm font-normal text-gray-500">(optional)</span>
              </span>
              <input
                value={plans}
                onChange={(e) => setPlans(e.target.value)}
                placeholder="e.g. class, then coffee with friends"
                className={inputStyle}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-medium">Date</span>
          <input
            key={`${mode}-${today}`}
            name="date"
            type="date"
            required
            defaultValue={mode === "everyday" ? today : undefined}
            className={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">City</span>
          <input
            name="city"
            required
            placeholder="e.g. Baltimore, MD"
            className={inputStyle}
          />
        </label>

        {mode === "event" && (
          <div className="flex flex-col gap-1">
            <span className="font-medium">Venue</span>
            <div className="flex gap-3">
              <label className={`${inputStyle} flex flex-1 items-center gap-2`}>
                <input type="radio" name="venue" value="indoor" defaultChecked />
                Indoor
              </label>
              <label className={`${inputStyle} flex flex-1 items-center gap-2`}>
                <input type="radio" name="venue" value="outdoor" />
                Outdoor
              </label>
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-medium">Your style</span>
          <select name="style" className={inputStyle}>
            <option value="No preference">No preference</option>
            <option value="Feminine">Feminine</option>
            <option value="Masculine">Masculine</option>
            <option value="Androgynous">Androgynous</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Describe your vibe (optional)</span>
          <input
            name="vibe"
            placeholder="e.g. cottagecore, streetwear, all black"
            className={inputStyle}
          />
        </label>

        {mode === "everyday" && (
          <label className="flex items-start gap-3 rounded-lg border border-gray-400 p-3">
            <input
              type="checkbox"
              checked={useCloset && closetReady}
              disabled={!closetReady}
              onChange={(e) => setUseCloset(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Use my closet</span>
              <span className="block text-sm text-gray-500">
                {closetCount === null ? (
                  "Checking your closet..."
                ) : closetReady ? (
                  `Build the outfit from the ${closetCount} piece${closetCount === 1 ? "" : "s"} you own`
                ) : (
                  <>
                    Your closet is empty.{" "}
                    <Link href="/closet" className="underline">
                      Add pieces →
                    </Link>
                  </>
                )}
              </span>
            </span>
          </label>
        )}

        <button
          type="submit"
          className="mt-2 rounded-lg p-3 font-semibold text-white"
          style={{ background: `linear-gradient(90deg, ${brandColors[1]}, ${brandColors[2]})` }}
        >
          {goToCloset ? "Pick from my closet ✨" : "Build my look ✨"}
        </button>
      </Form>

      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <Link href="/outfits" className="underline">
          My saved outfits →
        </Link>
        <Link href="/closet" className="underline">
          My closet →
        </Link>
      </div>
    </main>
  );
}