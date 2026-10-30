import { Suspense } from "react";
import ClosetOutfit from "./ClosetOutfit";
import LoadingLook from "../results/LoadingLook";

export default function ClosetOutfitPage() {
  return (
    <Suspense fallback={<LoadingLook />}>
      <ClosetOutfit />
    </Suspense>
  );
}