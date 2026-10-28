"use client";

import { useEffect, useState } from "react";
import { brandColors } from "../brand";

const messages = [
  "Checking the forecast...",
  "Raiding the closet...",
  "Mixing the color palette...",
  "Consulting the stylist...",
  "Steaming out the wrinkles...",
  "Picking the perfect shoes...",
];

export default function LoadingLook() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex gap-2">
        {brandColors.map((color, i) => (
          <span
            key={color}
            className="h-10 w-10 animate-bounce rounded-full"
            style={{ backgroundColor: color, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="text-lg font-medium">{messages[index]}</p>
    </div>
  );
}