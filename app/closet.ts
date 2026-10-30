import type { Wardrobe } from "./themes";
import { supabase } from "./supabase";

export type Slot = keyof Wardrobe;

export const SLOTS: { key: Slot; label: string }[] = [
  { key: "tops", label: "Tops" },
  { key: "bottoms", label: "Bottoms" },
  { key: "outerwear", label: "Outerwear" },
  { key: "shoes", label: "Shoes" },
  { key: "accessories", label: "Accessories" },
];

export const TAGS = ["warm", "lightweight", "dressy", "casual", "comfy", "waterproof", "statement", "athletic"];

export type ClosetItem = {
  id: string;
  createdAt: string;
  name: string;
  slot: Slot;
  color: string;
  tags: string[];
};

export type NewClosetItem = Omit<ClosetItem, "id" | "createdAt">;

type ClosetRow = {
  id: string;
  created_at: string;
  name: string;
  slot: Slot;
  color: string;
  tags: string[] | null;
};

// ---------- Device storage ----------

const STORAGE_KEY = "closet-items";

function readDevice(): ClosetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDevice(items: ClosetItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.error("Could not save closet to this device");
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

function fromRow(row: ClosetRow): ClosetItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    slot: row.slot,
    color: row.color,
    tags: row.tags ?? [],
  };
}

function toRow(item: NewClosetItem) {
  return { name: item.name, slot: item.slot, color: item.color, tags: item.tags };
}

// ---------- What the rest of the app uses ----------

export async function getCloset(): Promise<ClosetItem[]> {
  if (!(await currentUserId())) return readDevice();

  const { data, error } = await supabase
    .from("closet_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load closet:", error.message);
    return [];
  }
  return (data as ClosetRow[]).map(fromRow);
}

export async function addClosetItem(item: NewClosetItem): Promise<void> {
  if (!(await currentUserId())) {
    const saved: ClosetItem = { ...item, id: makeId(), createdAt: new Date().toISOString() };
    writeDevice([...readDevice(), saved]);
    return;
  }

  const { error } = await supabase.from("closet_items").insert(toRow(item));
  if (error) throw new Error(error.message);
}

export async function updateClosetItem(id: string, item: NewClosetItem): Promise<void> {
  if (!(await currentUserId())) {
    writeDevice(readDevice().map((existing) => (existing.id === id ? { ...existing, ...item } : existing)));
    return;
  }

  const { error } = await supabase.from("closet_items").update(toRow(item)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClosetItem(id: string): Promise<void> {
  if (!(await currentUserId())) {
    writeDevice(readDevice().filter((item) => item.id !== id));
    return;
  }

  const { error } = await supabase.from("closet_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function countDeviceCloset(): number {
  return readDevice().length;
}

export async function moveDeviceClosetToAccount(): Promise<void> {
  const deviceItems = readDevice();
  if (deviceItems.length === 0) return;

  const rows = deviceItems.map((item) => ({ ...toRow(item), created_at: item.createdAt }));
  const { error } = await supabase.from("closet_items").insert(rows);
  if (error) throw new Error(error.message);

  writeDevice([]);
}

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