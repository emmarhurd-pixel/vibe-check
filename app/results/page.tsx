import { Suspense } from "react";
import Link from "next/link";

type Params = Promise<{ [key: string]: string | undefined }>;

export default function ResultsPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="mx-auto max-w-md p-6">
      <Suspense fallback={<p>Loading your look...</p>}>
        <EventSummary searchParams={searchParams} />
      </Suspense>
      <Link href="/" className="mt-8 inline-block underline">
        ← Start over
      </Link>
    </main>
  );
}

async function EventSummary({ searchParams }: { searchParams: Params }) {
  const { type, name, date, city, venue } = await searchParams;

  return (
    <>
      <h1 className="text-3xl font-bold">{name}</h1>
      <ul className="mt-4 space-y-1">
        <li>Type: {type}</li>
        <li>Date: {date}</li>
        <li>City: {city}</li>
        <li>Venue: {venue}</li>
      </ul>
      <p className="mt-6 text-gray-500">
        Color palette and outfit ideas will go here.
      </p>
    </>
  );
}