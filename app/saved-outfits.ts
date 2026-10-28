import type { Piece } from "./themes";
import { supabase } from "./supabase";

export type SavedOutfit = {
  id: string;
  savedAt: string;
  eventName: string;
  eventType: string;
  date: string;
  city: string;
  accent: string;
  background: string;
  text: string;
  pieces: Piece[];
};

type NewOutfit = Omit<SavedOutfit, "id" | "savedAt">;

type OutfitRow = {
  id: string;
  saved_at: string;
  event_name: string;
  event_type: string | null;
  date: string | null;
  city: string | null;
  accent: string | null;
  background: string | null;
  text_color: string | null;
  pieces: Piece[];
};

// ---------- Device storage ----------

const STORAGE_KEY = "saved-outfits";

function readDevice(): SavedOutfit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
    accent: outfit.accent,
    background: outfit.background,
    text_color: outfit.text,
    pieces: outfit.pieces,
  };
}

function fromRow(row: OutfitRow): SavedOutfit {
  return {
    id: row.id,
    savedAt: row.saved_at,
    eventName: row.event_name,
    eventType: row.event_type ?? "",
    date: row.date ?? "",
    city: row.city ?? "",
    accent: row.accent ?? "#000000",
    background: row.background ?? "#FFFFFF",
    text: row.text_color ?? "#000000",
    pieces: row.pieces ?? [],
  };
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