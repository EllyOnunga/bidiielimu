/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface AppearanceContextType {
  appearance: Theme;
  toggleAppearance: () => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(
  undefined,
);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appearance, setAppearance] = useState<Theme>(() => {
    const saved = localStorage.getItem("appearance");
    return (saved as Theme) || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(appearance);
    localStorage.setItem("appearance", appearance);
  }, [appearance]);

  const toggleAppearance = () => {
    setAppearance((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <AppearanceContext.Provider value={{ appearance, toggleAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
};
