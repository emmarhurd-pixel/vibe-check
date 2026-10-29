import type { Piece } from "./themes";
import { supabase } from "./supabase";

export type SavedOutfit = {
  id: string;
  savedAt: string;
  eventName: string;
  eventType: string;
  date: string;
  city: string;
  venue: string;
  style: string;
  vibe: string;
  accent: string;
  background: string;
  text: string;
  pieces: Piece[];
  palette: string[];
  items: string[];
  searches: string[];
};

export type NewOutfit = Omit<SavedOutfit, "id" | "savedAt">;

type OutfitRow = {
  id: string;
  saved_at: string;
  event_name: string;
  event_type: string | null;
  date: string | null;
  city: string | null;
  venue: string | null;
  style: string | null;
  vibe: string | null;
  accent: string | null;
  background: string | null;
  text_color: string | null;
  pieces: Piece[] | null;
  palette: string[] | null;
  items: string[] | null;
  searches: string[] | null;
};

// ---------- Device storage ----------

const STORAGE_KEY = "saved-outfits";

function fillMissing(outfit: Partial<SavedOutfit> & { id: string; savedAt: string }): SavedOutfit {
  return {
    id: outfit.id,
    savedAt: outfit.savedAt,
    eventName: outfit.eventName ?? "",
    eventType: outfit.eventType ?? "",
    date: outfit.date ?? "",
    city: outfit.city ?? "",
    venue: outfit.venue ?? "",
    style: outfit.style ?? "",
    vibe: outfit.vibe ?? "",
    accent: outfit.accent ?? "#000000",
    background: outfit.background ?? "#FFFFFF",
    text: outfit.text ?? "#000000",
    pieces: outfit.pieces ?? [],
    palette: outfit.palette ?? [],
    items: outfit.items ?? [],
    searches: outfit.searches ?? [],
  };
}

function readDevice(): SavedOutfit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).map(fillMissing) : [];
  } catch {
    return [];
  }
}

function writeDevice(outfits: SavedOutfit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
  } catch {
    console.error("Could not save outfits to this device");
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ---------- Account storage ----------

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function toRow(outfit: NewOutfit) {
  return {
    event_name: outfit.eventName,
    event_type: outfit.eventType,
    date: outfit.date,
    city: outfit.city,
    venue: outfit.venue,
    style: outfit.style,
    vibe: outfit.vibe,
    accent: outfit.accent,
    background: outfit.background,
    text_color: outfit.text,
    pieces: outfit.pieces,
    palette: outfit.palette,
    items: outfit.items,
    searches: outfit.searches,
  };
}

function fromRow(row: OutfitRow): SavedOutfit {
  return fillMissing({
    id: row.id,
    savedAt: row.saved_at,
    eventName: row.event_name,
    eventType: row.event_type ?? undefined,
    date: row.date ?? undefined,
    city: row.city ?? undefined,
    venue: row.venue ?? undefined,
    style: row.style ?? undefined,
    vibe: row.vibe ?? undefined,
    accent: row.accent ?? undefined,
    background: row.background ?? undefined,
    text: row.text_color ?? undefined,
    pieces: row.pieces ?? undefined,
    palette: row.palette ?? undefined,
    items: row.items ?? undefined,
    searches: row.searches ?? undefined,
  });
}

// ---------- What the rest of the app uses ----------

export async function getOutfits(): Promise<SavedOutfit[]> {
  if (!(await currentUserId())) return readDevice();

  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("Could not load outfits:", error.message);
    return [];
  }
  return (data as OutfitRow[]).map(fromRow);
}

export async function getOutfit(id: string): Promise<SavedOutfit | null> {
  if (!(await currentUserId())) {
    return readDevice().find((outfit) => outfit.id === id) ?? null;
  }

  const { data, error } = await supabase.from("outfits").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return fromRow(data as OutfitRow);
}

export async function saveOutfit(outfit: NewOutfit): Promise<void> {
  if (!(await currentUserId())) {
    const saved: SavedOutfit = { ...outfit, id: makeId(), savedAt: new Date().toISOString() };
    writeDevice([saved, ...readDevice()]);
    return;
  }

  const { error } = await supabase.from("outfits").insert(toRow(outfit));
  if (error) throw new Error(error.message);
}

export async function deleteOutfit(id: string): Promise<void> {
  if (!(await currentUserId())) {
    writeDevice(readDevice().filter((outfit) => outfit.id !== id));
    return;
  }

  const { error } = await supabase.from("outfits").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function countDeviceOutfits(): number {
  return readDevice().length;
}

export async function moveDeviceOutfitsToAccount(): Promise<void> {
  const deviceOutfits = readDevice();
  if (deviceOutfits.length === 0) return;

  const rows = deviceOutfits.map((outfit) => ({ ...toRow(outfit), saved_at: outfit.savedAt }));
  const { error } = await supabase.from("outfits").insert(rows);
  if (error) throw new Error(error.message);

  writeDevice([]);
}