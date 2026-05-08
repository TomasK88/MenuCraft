// =====================================================
// main.jsx - vstupní bod React aplikace
// -----------------------------------------------------
// Tento soubor se spouští jako první. Jeho úkolem je:
//   1) Najít HTML element s id="root" (v index.html)
//   2) Obalit celou aplikaci globálními providery
//   3) Vykreslit kořenovou komponentu <App />
//
// "Provider" je React pattern - komponenta, která předává
// data/nastavení celému stromu potomků přes Context API,
// bez nutnosti předávat props přes každou úroveň.
// =====================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// BrowserRouter zajišťuje klientské routování (URL navigace bez reload stránky)
import { BrowserRouter } from "react-router-dom";

// ThemeProvider předá naše MUI téma (barvy, fonty...) všem MUI komponentám v aplikaci
import { ThemeProvider } from "@mui/material/styles";

// CssBaseline = MUI reset stylů - sjednotí výchozí styly prohlížečů (margin, box-sizing atp.)
import CssBaseline from "@mui/material/CssBaseline";

// LocalizationProvider zpřístupní date-picker komponentám lokalizaci a adaptér pro dayjs
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Nastavíme českou lokalizaci pro dayjs - názvy měsíců, dnů, formát datumu
import "dayjs/locale/cs";

import theme from "./theme";
import App from "./App";
import "./index.css";

// createRoot() je React 18+ API pro vykreslení stromu.
// Starší varianta ReactDOM.render() je zastaralá.
createRoot(document.getElementById("root")).render(
  // StrictMode způsobí, že React v development módu volá render a efekty dvakrát.
  // Pomáhá odhalit vedlejší efekty a chyby v kódu dříve. V produkci nefunguje.
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {/* CssBaseline musí být uvnitř ThemeProvider, aby použilo náš theme.palette.background */}
        <CssBaseline />
        {/* adapterLocale="cs" nastaví český formát datumů v date-pickeru */}
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
