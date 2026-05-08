// =====================================================
// constants.js - sdílené konstanty aplikace
// -----------------------------------------------------
// Centrální místo pro hodnoty, které se používají na více
// místech. Díky tomu stačí změnit hodnotu zde a projeví se
// všude - nemusíme hledat, kde všude jsme ji napsali.
// =====================================================

// URL backendu. V development módu server běží na portu 3000.
// Při nasazení na produkci by se tato hodnota změnila na skutečnou URL.
export const API_BASE = "http://localhost:3000";

// ---- Kategorie jídel ----
// Pole objektů pro select/dropdown komponenty (value = API hodnota, label = zobrazený text)
export const CATEGORIES = [
  { value: "SOUP", label: "Polévka" },
  { value: "MAIN_COURSE", label: "Hlavní jídlo" },
];

// Mapa API hodnota → zobrazený text. Rychlé vyhledávání O(1) místo hledání v poli.
// Použití: CATEGORY_LABELS["SOUP"] → "Polévka"
export const CATEGORY_LABELS = {
  SOUP: "Polévka",
  MAIN_COURSE: "Hlavní jídlo",
};

// ---- Dny v týdnu ----
// Mapa anglického ISO názvu dne → český název pro zobrazení.
export const DAY_LABELS = {
  MONDAY: "Pondělí",
  TUESDAY: "Úterý",
  WEDNESDAY: "Středa",
  THURSDAY: "Čtvrtek",
  FRIDAY: "Pátek",
};

// Pořadí dnů pro řazení týdenního menu (backend může vracet v libovolném pořadí).
// indexOf() v .sort() zajistí správné Mon → Fri pořadí.
export const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

// ---- EU alergeny (nařízení EU č. 1169/2011) ----
// 14 povinně označovaných alergenů. Čísla 1–14 jsou standardizovaná
// a musí být uvedena na jídelních lístcích restaurací a jídelen.
export const ALLERGENS = [
  { id: 1, label: "1 – Lepek" },
  { id: 2, label: "2 – Korýši" },
  { id: 3, label: "3 – Vejce" },
  { id: 4, label: "4 – Ryby" },
  { id: 5, label: "5 – Arašídy" },
  { id: 6, label: "6 – Sója" },
  { id: 7, label: "7 – Mléko" },
  { id: 8, label: "8 – Skořápkové plody" },
  { id: 9, label: "9 – Celer" },
  { id: 10, label: "10 – Hořčice" },
  { id: 11, label: "11 – Sezam" },
  { id: 12, label: "12 – Oxid siřičitý" },
  { id: 13, label: "13 – Vlčí bob" },
  { id: 14, label: "14 – Měkkýši" },
];
