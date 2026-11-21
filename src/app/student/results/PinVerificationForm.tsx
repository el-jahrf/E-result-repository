"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Term = "FIRST" | "SECOND" | "THIRD";

interface PinVerificationFormProps {
  sessionId: string;
  term: Term;
}

function formatPin(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 15);

  return digits.match(/.{1,4}/g)?.join("-") ?? "";
}

export default function PinVerificationForm({
  sessionId,
  term,
}: PinVerificationFormProps) {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const digits = pin.replace(/\D/g, "");

    if (digits.length !== 15) {
      setError("Please enter your complete 15-digit result PIN.");
      return;
    }

    if (!sessionId || !term) {
      setError("Please select an academic session and term.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/student/result-pin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin: digits,
          sessionId,
          term,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to verify your result PIN.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="resultPin"
          className="mb-2 block text-sm font-semibold text-[#4A2C20]"
        >
          Result PIN
        </label>

        <input
          id="resultPin"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(event) => setPin(formatPin(event.target.value))}
          placeholder="XXXX-XXXX-XXXX-XXX"
          maxLength={18}
          className="w-full rounded-xl border border-[#C8A878] bg-white px-4 py-3 text-center text-lg font-semibold tracking-widest text-[#2B211C] outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-[#4A2C20] focus:ring-2 focus:ring-[#C8A878]/40"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#4A2C20] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#7A5038] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying PIN..." : "Verify Result PIN"}
      </button>
    </form>
  );
}