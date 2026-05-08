// =====================================================
// theme.js - globální MUI téma aplikace
// -----------------------------------------------------
// Material UI umožňuje přizpůsobit si celý vizuální styl
// přes jeden centrální objekt "theme". Místo přepisování
// stylů každé komponenty zvlášť zde definujeme barvy,
// zaoblení, písmo a MUI je automaticky aplikuje všude.
//
// createTheme() vezme náš objekt a doplní zbytek výchozích
// hodnot (stovky dalších parametrů jako spacing, shadows atp.)
// =====================================================

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    // Primární barva = hlavní akcentová barva aplikace (tlačítka, odkazy, aktivní stavy).
    // Použili jsme sytou fialovou z Figma návrhu.
    primary: {
      main: "#5C4AC7",       // hlavní odstín
      light: "#7B68D9",      // světlejší varianta (hover efekty)
      dark: "#3D2FA0",       // tmavší varianta (aktivní stav)
      contrastText: "#fff",  // barva textu NA primárním pozadí (musí mít dostatečný kontrast)
    },
    secondary: {
      main: "#625B71",
    },
    // Barvy pozadí celé aplikace a papírových komponent (Card, Paper)
    background: {
      default: "#FFFFFF",    // bílé pozadí stránky (jako ve Figma)
      paper: "#FFFFFF",      // bílé pozadí karet a papírů
    },
    // Barvy pro stavové informace (úspěch, chyba, varování, info)
    success: { main: "#2E7D32" },
    error: { main: "#C62828" },
  },
  shape: {
    // Zaoblení rohů komponent – aplikuje se na Button, Card, TextField atp.
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Nadpisy h5 a h6 mají tučnější řez pro lepší hierarchii
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    // Globální přizpůsobení konkrétních komponent
    MuiButton: {
      styleOverrides: {
        // Všechna tlačítka budou mít velká písmena vypnutá (MUI defaultně zapíná)
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
      },
      defaultProps: {
        // Výchozí varianta tlačítek = "contained" (plné pozadí)
        disableElevation: true,
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Navbar bílý s jemným spodním ohraničením (ne barevný jako výchozí MUI)
          backgroundColor: "#FFFFFF",
          color: "#1a1a2e",
          borderBottom: "1px solid #E8E8F0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export default theme;
