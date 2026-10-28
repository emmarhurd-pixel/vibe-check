import type { Piece } from "./themes";

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

export async function getOutfits(): Promise<SavedOutfit[]> {
  return readDevice();
}

export async function saveOutfit(
  outfit: Omit<SavedOutfit, "id" | "savedAt">
): Promise<SavedOutfit> {
  const saved: SavedOutfit = { ...outfit, id: makeId(), savedAt: new Date().toISOString() };
  writeDevice([saved, ...readDevice()]);
  return saved;
}

export async function deleteOutfit(id: string): Promise<void> {
  writeDevice(readDevice().filter((outfit) => outfit.id !== id));
}