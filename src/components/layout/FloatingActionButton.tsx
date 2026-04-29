"use client";

import { Plus } from "lucide-react";
import { useAddProspect } from "@/context/add-prospect-context";

export function FloatingActionButton() {
  const { open } = useAddProspect();

  return (
    <button
      type="button"
      aria-label="Add prospect"
      onClick={() => open()}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
