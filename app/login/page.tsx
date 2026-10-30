"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabase";
import { countDeviceOutfits, moveDeviceOutfitsToAccount } from "../saved-outfits";
import { countDeviceCloset, moveDeviceClosetToAccount } from "../closet";

const inputStyle = "rounded-lg border border-gray-400 bg-transparent p-3";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("signin");
      setBusy(false);
      return;
    }

    const outfitCount = countDeviceOutfits();
    const closetCount = countDeviceCloset();

    if (outfitCount + closetCount > 0) {
      const parts: string[] = [];
      if (outfitCount > 0) parts.push(`${outfitCount} outfit${outfitCount === 1 ? "" : "s"}`);
      if (closetCount > 0) parts.push(`${closetCount} closet piece${closetCount === 1 ? "" : "s"}`);

      if (window.confirm(`Move the ${parts.join(" and ")} saved on this device into your account?`)) {
        try {
          await moveDeviceOutfitsToAccount();
          await moveDeviceClosetToAccount();
        } catch (moveError) {
          console.error(moveError);
          window.alert("Some items couldn't be moved. They're still saved on this device.");
        }
      }
    }

    router.push("/outfits");
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Save your outfits and closet to your account and see them on any device.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputStyle}
          />
        </label>

        {message && <p className="text-sm text-red-500">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-lg bg-foreground p-3 font-semibold text-background disabled:opacity-50"
        >
          {busy ? "One sec..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage("");
        }}
        className="mt-6 text-sm underline"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>

      <Link href="/" className="mt-8 block text-sm underline">
        ← Back
      </Link>
    </main>
  );
}