"use client";

import { createContext, useCallback, useContext, useState } from "react";

type AnnounceFunction = (message: string) => void;

const AriaLiveContext = createContext<AnnounceFunction>(() => {});

export function useAnnounce() {
  return useContext(AriaLiveContext);
}

export function AriaLiveAnnouncer({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  const announce: AnnounceFunction = useCallback((msg: string) => {
    // Clear first to ensure re-announcement of same message
    setMessage("");
    requestAnimationFrame(() => setMessage(msg));
  }, []);

  return (
    <AriaLiveContext.Provider value={announce}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    </AriaLiveContext.Provider>
  );
}
