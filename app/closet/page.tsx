"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import {
  addClosetItem,
  deleteClosetItem,
  getCloset,
  updateClosetItem,
  SLOTS,
  TAGS,
  type ClosetItem,
  type Slot,
} from "../closet";
import { guessSlot } from "../closet";

const QUICK_COLORS = [
  { name: "Black", hex: "#1F1F1F" },
  { name: "White", hex: "#F5F5F5" },
  { name: "Cream", hex: "#F2EAD3" },
  { name: "Beige", hex: "#D8C3A5" },
  { name: "Gray", hex: "#8C8C8C" },
  { name: "Brown", hex: "#6B4423" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Denim", hex: "#4A6A8A" },
  { name: "Blue", hex: "#3A6EA5" },
  { name: "Green", hex: "#2E6B4A" },
  { name: "Olive", hex: "#6B6B3A" },
  { name: "Red", hex: "#B22D2D" },
  { name: "Burgundy", hex: "#6D1A2A" },
  { name: "Pink", hex: "#F2A7C3" },
  { name: "Lilac", hex: "#C8A2C8" },
  { name: "Purple", hex: "#7B5EA7" },
  { name: "Yellow", hex: "#E9C46A" },
  { name: "Orange", hex: "#E07A3F" },
];

const SUGGESTIONS = [
  "White t-shirt",
  "Black tank top",
  "Gray hoodie",
  "Denim button-up",
  "Striped long-sleeve",
  "Cream knit sweater",
  "Blue jeans",
  "Black jeans",
  "Khaki chinos",
  "Black leggings",
  "Denim shorts",
  "Pleated midi skirt",
  "Denim jacket",
  "Black puffer coat",
  "Camel trench coat",
  "Gray cardigan",
  "Leather jacket",
  "Rain jacket",
  "White sneakers",
  "Black ankle boots",
  "Brown loafers",
  "Sandals",
  "Running shoes",
  "Black belt",
  "Tote bag",
  "Baseball cap",
  "Silver necklace",
  "Gold hoop earrings",
  "Sunglasses",
];

const inputStyle = "rounded-lg border border-gray-400 bg-transparent p-3";

export default function ClosetPage() {
  const [items, setItems] = useState<ClosetItem[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slot, setSlot] = useState<Slot>("tops");
  const [slotTouched, setSlotTouched] = useState(false);
  const [color, setColor] = useState(QUICK_COLORS[0].hex);
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    getCloset().then(setItems);
  }, []);

  async function refresh() {
    setItems(await getCloset());
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slotTouched && value.trim()) setSlot(guessSlot(value));
  }

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  function resetForm() {
    setName("");
    setTags([]);
    setEditingId(null);
    setSlotTouched(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);
    setMessage("");
    try {
      const item = { name: trimmed, slot, color, tags };
      if (editingId) {
        await updateClosetItem(editingId, item);
        setMessage(`Updated ${trimmed}`);
      } else {
        await addClosetItem(item);
        setMessage(`Added ${trimmed}`);
      }
      resetForm();
      await refresh();
      nameRef.current?.focus();
    } catch (error) {
      console.error(error);
      setMessage("Couldn't save that piece. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: ClosetItem) {
    setEditingId(item.id);
    setName(item.name);
    setSlot(item.slot);
    setSlotTouched(true);
    setColor(item.color);
    setTags(item.tags);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(item: ClosetItem) {
    if (!window.confirm(`Delete ${item.name} from your closet?`)) return;
    try {
      await deleteClosetItem(item.id);
      if (editingId === item.id) resetForm();
      await refresh();
    } catch (error) {
      console.error(error);
      window.alert("Couldn't delete that piece. Please try again.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setEmail(null);
    resetForm();
    await refresh();
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">My closet</h1>

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

      <p className="mt-4 text-sm">
        Add the pieces you own, and Vibe Check will build everyday outfits from them.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 rounded-xl border border-gray-400 p-4">
        <h2 className="text-lg font-semibold">{editingId ? "Edit piece" : "Add a piece"}</h2>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Name</span>
          <input
            ref={nameRef}
            required
            list="closet-suggestions"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Black straight-leg jeans"
            className={inputStyle}
          />
          <datalist id="closet-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Type</span>
          <select
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value as Slot);
              setSlotTouched(true);
            }}
            className={inputStyle}
          >
            {SLOTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-medium">Color</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_COLORS.map((c) => {
              const selected = color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  aria-label={c.name}
                  aria-pressed={selected}
                  title={c.name}
                  className="h-8 w-8 rounded-full"
                  style={{
                    backgroundColor: c.hex,
                    border: selected ? "3px solid currentColor" : "1px solid #9ca3af",
                  }}
                />
              );
            })}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-gray-400 bg-transparent"
            />
            <span>Custom color · {color.toUpperCase()}</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-medium">
            Tags <span className="text-sm font-normal text-gray-500">(optional)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selected}
                  className={`rounded-full px-3 py-1 text-sm ${
                    selected ? "bg-foreground text-background" : "border border-gray-400"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {message && <p className="text-sm">{message}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-foreground px-4 py-3 font-semibold text-background disabled:opacity-50"
          >
            {busy ? "Saving..." : editingId ? "Save changes" : "Add to closet"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm underline">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="mt-8">
        {items === null ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Your closet is empty. Add your first piece above!</p>
        ) : (
          SLOTS.map((s) => {
            const inSlot = items.filter((item) => item.slot === s.key);
            if (inSlot.length === 0) return null;
            return (
              <div key={s.key} className="mt-6">
                <h2 className="text-lg font-semibold">
                  {s.label} <span className="text-sm font-normal text-gray-500">({inSlot.length})</span>
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {inSlot.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-400 p-3"
                      style={editingId === item.id ? { borderWidth: 2, borderColor: "currentColor" } : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className="h-7 w-7 shrink-0 rounded-full border border-gray-400"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex flex-col">
                          <span>{item.name}</span>
                          {item.tags.length > 0 && (
                            <span className="text-xs text-gray-500">{item.tags.join(" · ")}</span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="shrink-0 text-sm underline"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <Link href="/" className="mt-10 inline-block underline">
        ← Back
      </Link>
    </main>
  );
}