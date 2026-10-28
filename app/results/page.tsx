import { Suspense } from "react";
import Link from "next/link";
import { generateTheme } from "../generate-theme";
import { getWeather } from "../weather";
import { getInspoPhotos, pinterestSearchUrl, UNSPLASH_URL } from "../photos";
import OutfitBuilder from "./OutfitBuilder";
import LoadingLook from "./LoadingLook";

type Params = Promise<{ [key: string]: string | undefined }>;

export default function ResultsPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<LoadingLook />}>
      <ThemedResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ThemedResults({ searchParams }: { searchParams: Params }) {
  const { type, name, date, city, venue, style, vibe, attempt } = await searchParams;
  const attemptNumber = Number(attempt ?? 0);

  const weather = await getWeather(city, date);
  const theme = await generateTheme({
    type,
    name,
    date,
    city,
    venue,
    style,
    vibe,
    weather,
    attempt: attemptNumber,
  });
  const photos = await getInspoPhotos(theme.searches);

  const nextAttempt = new URLSearchParams();
  for (const [key, value] of Object.entries({ type, name, date, city, venue, style, vibe })) {
    if (value) nextAttempt.set(key, value);
  }
  nextAttempt.set("attempt", String(attemptNumber + 1));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <main className="mx-auto max-w-md p-6">
        <h1
          className={`text-4xl font-bold ${theme.fontClass}`}
          style={{ color: theme.accent }}
        >
          {name}
        </h1>
        <p className="mt-2 opacity-80">
          {type} · {city} · {date} · {venue}
        </p>

        {weather && (
          <div className="mt-6 rounded-lg border p-4" style={{ borderColor: theme.text }}>
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

        <h2 className={`mt-8 text-xl font-semibold ${theme.fontClass}`}>Color palette</h2>
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

        <h2 className={`mt-8 text-xl font-semibold ${theme.fontClass}`}>Outfit checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {theme.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <OutfitBuilder
          key={`${name}-${attemptNumber}`}
          wardrobe={theme.wardrobe}
          accent={theme.accent}
          text={theme.text}
          background={theme.background}
          headingClass={theme.fontClass}
          event={{ name: name ?? "", type: type ?? "", date: date ?? "", city: city ?? "" }}
        />

        <h2 className={`mt-8 text-xl font-semibold ${theme.fontClass}`}>Outfit inspo</h2>

        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <figure key={photo.id}>
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-3/4 w-full rounded-lg object-cover"
                />
                <figcaption className="mt-1 text-xs opacity-70">
                  Photo by{" "}
                  <a href={photo.photographerUrl} target="_blank" rel="noreferrer" className="underline">
                    {photo.photographer}
                  </a>{" "}
                  on{" "}
                  <a href={UNSPLASH_URL} target="_blank" rel="noreferrer" className="underline">
                    Unsplash
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm font-medium">See more on Pinterest</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {theme.searches.map((search) => (
              <a
                key={search}
                href={pinterestSearchUrl(search)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border px-3 py-1 text-sm"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                {search} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={`/results?${nextAttempt}`}
            className="rounded-full border-2 px-4 py-2 font-medium"
            style={{ borderColor: theme.accent, color: theme.accent }}
          >
            ↻ Try a different look
          </Link>
          <Link href="/" className="underline">
            ← Start over
          </Link>
        </div>
      </main>
    </div>
  );
}