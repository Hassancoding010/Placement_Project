"use client";

export default function PrintButton() {
  return (
    <div className="flex gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold"
      >
        Print card
      </button>
      <a href="/dashboard" className="border bg-white rounded-lg px-5 py-3 font-semibold">
        Back
      </a>
    </div>
  );
}