"use client";

import { useRouter } from "next/navigation";

export default function ClearResultPin() {
  const router = useRouter();

  async function handleViewResult() {
    await fetch("/api/student/result-pin/clear", {
      method: "POST",
    });

    router.push("/student/results");
  }

  return (
    <button
      type="button"
      onClick={handleViewResult}
      className="mt-6 inline-flex rounded-xl bg-[#4a2c20] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7a5038]"
    >
      View Result
    </button>
  );
}