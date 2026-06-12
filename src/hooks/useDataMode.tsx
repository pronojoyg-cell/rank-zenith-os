import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DataMode = "real" | "demo";

type DataModeContextValue = {
  mode: DataMode;
  isDemo: boolean;
  setMode: (mode: DataMode) => void;
};

const DataModeContext = createContext<DataModeContextValue | null>(null);

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>("real");

  useEffect(() => {
    const saved = window.localStorage.getItem("jee-os-data-mode");
    if (saved === "demo" || saved === "real") setModeState(saved);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDemo: mode === "demo",
      setMode: (nextMode: DataMode) => {
        setModeState(nextMode);
        window.localStorage.setItem("jee-os-data-mode", nextMode);
      },
    }),
    [mode],
  );

  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>;
}

export function useDataMode() {
  const context = useContext(DataModeContext);
  if (!context) throw new Error("useDataMode must be used within DataModeProvider");
  return context;
}