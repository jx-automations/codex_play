"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AddProspectContextValue {
  isOpen: boolean;
  open: (prefillHandle?: string) => void;
  close: () => void;
  prefillHandle: string;
}

const AddProspectContext = createContext<AddProspectContextValue | null>(null);

export function AddProspectProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefillHandle, setPrefillHandle] = useState("");

  function open(handle = "") {
    setPrefillHandle(handle);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setPrefillHandle("");
  }

  return (
    <AddProspectContext.Provider value={{ isOpen, open, close, prefillHandle }}>
      {children}
    </AddProspectContext.Provider>
  );
}

export function useAddProspect() {
  const ctx = useContext(AddProspectContext);
  if (!ctx) throw new Error("useAddProspect must be used inside AddProspectProvider.");
  return ctx;
}
