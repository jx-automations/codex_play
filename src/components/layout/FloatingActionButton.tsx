"use client";

import { useAddProspect } from "@/context/add-prospect-context";

export function FloatingActionButton() {
  const { open } = useAddProspect();

  return (
    <button
      type="button"
      aria-label="Add prospect"
      onClick={() => open()}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 md:bottom-6"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
