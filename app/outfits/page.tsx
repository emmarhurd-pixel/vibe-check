"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { deleteOutfit, getOutfits, type SavedOutfit } from "../saved-outfits";
import { formatDate, sortPiecesLightToDark } from "../format";

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<SavedOutfit[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    getOutfits().then(setOutfits);
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteOutfit(id);
      setOutfits(await getOutfits());
    } catch (error) {
      console.error(error);
      window.alert("Couldn't delete that outfit. Please try again.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setEmail(null);
    setOutfits(await getOutfits());
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">My outfits</h1>

      {email ? (
        <p className="mt-2 text-sm text-gray-500">
          Saved to your account ({email}) ·{" "}
          <button type="button" onClick={handleSignOut} className="underline">
            Sign out
          </button>
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Saved on this device ·{" "}
          <Link href="/login" className="underline">
            Sign in to save across devices
          </Link>
        </p>
      )}

      {outfits === null ? (
        <p className="mt-8">Loading...</p>
      ) : outfits.length === 0 ? (
        <p className="mt-8">No saved outfits yet. Build one and tap Save!</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {outfits.map((outfit) => (
            <article
              key={outfit.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: outfit.background, color: outfit.text }}
            >
              <Link href={`/outfits/${outfit.id}`} className="block">
                <h2 className="text-xl font-bold" style={{ color: outfit.accent }}>
                  {outfit.eventName}
                </h2>
                <p className="text-sm opacity-80">
                  {outfit.eventType} · {outfit.city} · {formatDate(outfit.date)}
                </p>
                <div className="mt-3 flex h-8 overflow-hidden rounded-md">
                  {sortPiecesLightToDark(outfit.pieces).map((piece) => (
                    <div
                      key={piece.name}
                      className="flex-1"
                      style={{ backgroundColor: piece.color }}
                      title={piece.name}
                    />
                  ))}
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {outfit.pieces.map((piece) => (
                    <li key={piece.name}>{piece.name}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-semibold" style={{ color: outfit.accent }}>
                  Open look →
                </p>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(outfit.id)}
                className="mt-3 text-sm underline"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}

      <Link href="/" className="mt-8 inline-block underline">
        ← Back
      </Link>
    </main>
  );
}