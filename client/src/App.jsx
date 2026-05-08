// =====================================================
// App.jsx - kořenová komponenta aplikace
// -----------------------------------------------------
// Definuje strukturu celé aplikace:
//   - Navbar (navigační lišta) je viditelný na všech stránkách
//   - Routes určí, která stránka (Page) se vykreslí podle aktuální URL
//
// react-router-dom funguje tak, že porovná aktuální URL path
// s definovanými Route path atributy a vykreslí odpovídající element.
// =====================================================

import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import GeneratorPage from "./pages/GeneratorPage";
import DishLibraryPage from "./pages/DishLibraryPage";

function App() {
  return (
    <>
      {/* Navbar je mimo Routes - vykreslí se vždy bez ohledu na URL */}
      <Navbar />

      <Routes>
        {/* "/" → Generátor týdenního menu */}
        <Route path="/" element={<GeneratorPage />} />

        {/* "/library" → Knihovna jídel */}
        <Route path="/library" element={<DishLibraryPage />} />

        {/* Libovolná neznámá URL → přesměruje na hlavní stránku */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
