import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface ThemeContextType {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  schoolName: 'Scholara',
  logoUrl: null,
  primaryColor: '#2DD4BF',
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Omit<ThemeContextType, 'isLoading'>>({
    schoolName: 'Scholara',
    logoUrl: null,
    primaryColor: '#2DD4BF',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        // Assume API is served on the same domain or configured via base URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${apiUrl}/api/v1/theme/`);
        
        const { school_name, logo_url, primary_color } = response.data;
        
        setTheme({
          schoolName: school_name || 'Scholara',
          logoUrl: logo_url || null,
          primaryColor: primary_color || '#2DD4BF',
        });

        // Inject dynamic CSS variable into the root document
        if (primary_color) {
          document.documentElement.style.setProperty('--tenant-primary-base', primary_color);
        }
      } catch (error) {
        console.error('Failed to load tenant theme:', error);
        // Fallback to default Teal
        document.documentElement.style.setProperty('--tenant-primary-base', '#2DD4BF');
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
