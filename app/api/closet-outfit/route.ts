import { NextResponse } from "next/server";
import { getWeather } from "../../weather";
import { pickFromCloset, type ClosetPiece } from "../../closet-ai";

const SLOTS = ["tops", "bottoms", "outerwear", "shoes", "accessories"];
const MAX_ITEMS = 80;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const text = (value: unknown) => (typeof value === "string" ? value.slice(0, 200) : undefined);

  const closet: ClosetPiece[] = (Array.isArray(body.closet) ? body.closet : [])
    .filter(
      (p: ClosetPiece) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.color === "string" &&
        SLOTS.includes(p.slot)
    )
    .slice(0, MAX_ITEMS)
    .map((p: ClosetPiece) => ({
      id: p.id,
      name: p.name.slice(0, 80),
      slot: p.slot,
      color: p.color,
      tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string").slice(0, 8) : [],
    }));

  if (closet.length === 0) {
    return NextResponse.json({ error: "Your closet is empty" }, { status: 400 });
  }

  const date = text(body.date);
  const city = text(body.city);
  const weather = await getWeather(city, date);

  const result = await pickFromCloset({
    name: text(body.name),
    date,
    city,
    style: text(body.style),
    vibe: text(body.vibe),
    attempt: Number(body.attempt) || 0,
    weather,
    closet,
  });

  return NextResponse.json({ weather, ...result });
}