import React, { createContext, useContext } from "react";
import { useTheme } from "../components/Config/ThemeManager";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}