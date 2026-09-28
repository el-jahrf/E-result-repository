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

  return [
    digits.slice(0, 4),
    digits.slice(4, 8),
    digits.slice(8, 12),
    digits.slice(12, 15),
  ]
    .filter(Boolean)
    .join("-");
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
      setError("Please enter your complete 15-digit Result PIN.");
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
        setError(data.error || "Unable to verify Result PIN.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Result PIN verification error:", error);

      setError("Unable to verify your Result PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label
        htmlFor="result-pin"
        className="block text-sm font-semibold text-gray-700"
      >
        Result PIN
      </label>

      <input
        id="result-pin"
        name="result-pin"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={(event) => {
          setError("");
          setPin(formatPin(event.target.value));
        }}
        placeholder="4444-4444-4444-444"
        maxLength={18}
        disabled={loading}
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-center font-mono text-lg font-bold tracking-widest text-gray-950 outline-none transition placeholder:font-normal placeholder:tracking-normal focus:border-gray-900 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-center text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-gray-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify Result PIN"}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-gray-400">
        Your Result PIN can be used up to the maximum number of times
        assigned by the school.
      </p>
    </form>
  );
}