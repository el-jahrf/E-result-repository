"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Term = "FIRST" | "SECOND" | "THIRD";

interface ClearResultPinProps {
  sessionId: string;
  term: Term;
}

export default function ClearResultPin({
  sessionId,
  term,
}: ClearResultPinProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleViewResult() {
    if (!sessionId || !term) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/student/result-pin/clear", {
        method: "POST",
      });
    } catch (error) {
      console.error("Unable to clear previous Result PIN:", error);
    } finally {
      router.push(
        `/student/results?sessionId=${encodeURIComponent(
          sessionId,
        )}&term=${encodeURIComponent(term)}`,
      );

      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleViewResult}
      disabled={loading}
      className="mt-6 inline-flex rounded-xl bg-[#4a2c20] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7a5038] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Opening Result..." : "View Result"}
    </button>
  );
}