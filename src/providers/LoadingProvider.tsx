import React from "react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

type Ctx = {
  show: (label?: string) => void;
  hide: () => void;
  wrap: <T>(p: Promise<T>, label?: string) => Promise<T>;
  isLoading: boolean;
};

const LoadingContext = React.createContext<Ctx | null>(null);

export function useLoading() {
  const ctx = React.useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [label, setLabel] = React.useState("Loading…");

  const show = (l?: string) => {
    if (l) setLabel(l);
    setIsLoading(true);
  };

  const hide = () => setIsLoading(false);

  const wrap = async <T,>(p: Promise<T>, l?: string) => {
    show(l);
    try {
      return await p;
    } finally {
      hide();
    }
  };

  const value: Ctx = { show, hide, wrap, isLoading };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay show={isLoading} label={label} />
    </LoadingContext.Provider>
  );
}
