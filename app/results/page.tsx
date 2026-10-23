import { Suspense } from "react";
import Link from "next/link";
import { generateTheme } from "../generate-theme";

type Params = Promise<{ [key: string]: string | undefined }>;

export default function ResultsPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<p className="p-6">Loading your look...</p>}>
      <ThemedResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ThemedResults({ searchParams }: { searchParams: Params }) {
  const { type, name, date, city, venue } = await searchParams;
const theme = await generateTheme({ type, name, date, city, venue });

  return (
    <div
      className={`min-h-screen ${theme.fontClass}`}
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-4xl font-bold" style={{ color: theme.accent }}>
          {name}
        </h1>
        <p className="mt-2 opacity-80">
          {type} · {city} · {date} · {venue}
        </p>

        <h2 className="mt-8 text-xl font-semibold">Color palette</h2>
        <div
          className="mt-3 flex overflow-hidden rounded-lg border"
          style={{ borderColor: theme.text }}
        >
          {theme.palette.map((color) => (
            <div
              key={color}
              className="h-16 flex-1"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <h2 className="mt-8 text-xl font-semibold">Outfit checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {theme.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <Link href="/" className="mt-10 inline-block underline">
          ← Start over
        </Link>
      </main>
    </div>
  );
}