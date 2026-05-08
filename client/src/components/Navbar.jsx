// =====================================================
// components/Navbar.jsx - navigační lišta aplikace
// -----------------------------------------------------
// Zobrazuje se na každé stránce (App.jsx ji umístí mimo Routes).
// Obsahuje logo a navigační tlačítka pro přepínání stránek.
//
// useLocation() hook vrátí aktuální URL path (např. "/library").
// Díky tomu víme, která záložka je aktivní a zvýrazníme ji.
// =====================================================

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

// Link z react-router-dom vytvoří odkaz, který NEprovede reload stránky.
// Místo toho změní URL v historii prohlížeče a React Router překreslí obsah.
import { Link, useLocation } from "react-router-dom";

// SVG ikona vidličky a nože z knihovny @mui/icons-material
import RestaurantIcon from "@mui/icons-material/Restaurant";

function Navbar() {
  // useLocation() hook - vrátí objekt s pathname, search, hash aktuální URL.
  // Používáme ho ke zjištění, na které stránce uživatel právě je.
  const { pathname } = useLocation();

  return (
    // AppBar je MUI komponenta pro navigační lištu (header).
    // elevation={0} odstraní výchozí stín - stylujeme ji přes theme.
    // position="static" = lišta zůstane na místě (nelpí na vrcholu při scrollování)
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo sekce - ikona + název aplikace */}
        <Box component={Link} to="/" sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1, textDecoration: "none", "&:hover": { textDecoration: "none" } }}>
          <Box
            sx={{
              // Kulatý fialový kruh kolem ikony - vizuální identita aplikace
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RestaurantIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ color: "primary.main", letterSpacing: 0.5 }}
          >
            MenuCraft
          </Typography>
        </Box>

        {/* Navigační tlačítka */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {/* Aktivní záložka má fialové pozadí, neaktivní je průhledná s textem */}
          <Button
            component={Link}
            to="/"
            // variant="contained" = plné barevné pozadí (aktivní stav)
            // variant="text" = průhledné pozadí (neaktivní stav)
            variant={pathname === "/" ? "contained" : "text"}
            color="primary"
            size="small"
          >
            Generátor
          </Button>
          <Button
            component={Link}
            to="/library"
            variant={pathname === "/library" ? "contained" : "text"}
            color="primary"
            size="small"
          >
            Knihovna jídel
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
