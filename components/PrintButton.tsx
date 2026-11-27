"use client";

import type { ReactNode } from "react";

export default function PrintButton({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold"
      >
        Print card
      </button>
      {children}
      <a href="/dashboard" className="border bg-white rounded-lg px-5 py-3 font-semibold">
        Back
      </a>
    </div>
  );
}
