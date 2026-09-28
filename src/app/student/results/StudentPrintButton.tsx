"use client";

export default function StudentPrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
    >
      Print / Download Result
    </button>
  );
}