import { Suspense } from "react";
import SavedLook from "./SavedLook";

export default function SavedLookPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md p-6">
          <p>Loading...</p>
        </main>
      }
    >
      <SavedLook />
    </Suspense>
  );
}