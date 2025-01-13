"use client";
import React, { createContext, useContext, useState } from "react";

interface IdleWatcherContextValue {
  disableIdleWatcher: boolean;
  setDisableIdleWatcher: (value: boolean) => void;
}

const IdleWatcherContext = createContext<IdleWatcherContextValue | undefined>(undefined);

export function IdleWatcherProvider({ children }: { children: React.ReactNode }) {
  const [disableIdleWatcher, setDisableIdleWatcher] = useState(false);

  return (
    <IdleWatcherContext.Provider value={{ disableIdleWatcher, setDisableIdleWatcher }}>
      {children}
    </IdleWatcherContext.Provider>
  );
}

export function useIdleWatcherContext() {
  const ctx = useContext(IdleWatcherContext);
  if (!ctx) {
    throw new Error("useIdleWatcherContext must be used inside <IdleWatcherProvider>");
  }
  return ctx;
}
