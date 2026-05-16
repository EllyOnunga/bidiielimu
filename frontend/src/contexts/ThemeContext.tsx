import React, { createContext, useContext, useEffect, useState } from "react";
import { themeService } from "../api/services/themeService";

interface ThemeContextType {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  schoolName: "ElimuHub",
  logoUrl: null,
  primaryColor: "#2DD4BF",
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Omit<ThemeContextType, "isLoading">>({
    schoolName: "ElimuHub",
    logoUrl: null,
    primaryColor: "#2DD4BF",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const data = await themeService.getTheme();

        const { school_name, logo_url, primary_color } = data;

        setTheme({
          schoolName: school_name || "ElimuHub",
          logoUrl: logo_url || null,
          primaryColor: primary_color || "#2DD4BF",
        });

        // Inject dynamic CSS variable into the root document
        if (primary_color) {
          document.documentElement.style.setProperty(
            "--tenant-primary-base",
            primary_color,
          );
        }
      } catch (error) {
        console.error("Failed to load tenant theme:", error);
        // Fallback to default Teal
        document.documentElement.style.setProperty(
          "--tenant-primary-base",
          "#2DD4BF",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ ...theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
