// =====================================================
// abl/menuDay/dateHelper.js - pomocné funkce pro práci s daty
// -----------------------------------------------------
// JavaScript Date objekt je notoricky složitý - timezone problémy,
// různé formáty, neintuitivní API. Tyto helper funkce izolují
// komplexní datovou logiku na jedno místo.
//
// Všechny funkce pracují s datumem jako řetězcem "YYYY-MM-DD"
// (ISO 8601 formát) a interně používají UTC, aby se vyhnuly
// problémům s časovými pásmy (letní/zimní čas apod.).
// =====================================================

// Mapa číselných indexů dnů (vrací je Date.getUTCDay()) na názvy.
// getUTCDay() vrací 0 pro neděli, 1 pro pondělí, ..., 6 pro sobotu.
const DAY_NAMES = [
  "SUNDAY",    // index 0
  "MONDAY",    // index 1
  "TUESDAY",   // index 2
  "WEDNESDAY", // index 3
  "THURSDAY",  // index 4
  "FRIDAY",    // index 5
  "SATURDAY",  // index 6
];

// Vrátí název dne v týdnu pro dané datum.
// Příklad: dayOfWeek("2026-05-11") → "MONDAY"
function dayOfWeek(dateString) {
  // Přidáme "T00:00:00Z" aby JavaScript interpretoval datum jako UTC půlnoc.
  // Bez toho by Date("2026-05-11") byl lokální čas a mohlo by dojít k posunu
  // přes půlnoc kvůli časovému pásmu (např. UTC+2 → datum se posune na předchozí den).
  const d = new Date(dateString + "T00:00:00Z");

  // getUTCDay() vrátí 0-6, DAY_NAMES[index] převede na textový název
  return DAY_NAMES[d.getUTCDay()];
}

// Spočítá ISO číslo týdne (1..53) a ISO rok pro dané datum.
//
// ISO 8601 definuje:
//   - Týden začíná PONDĚLÍM
//   - Týden 1 je ten, který obsahuje první čtvrtek roku
//   - ISO rok se může lišit od kalendářního roku:
//     Např. 2026-01-01 (čtvrtek) → týden 1 roku 2026
//     Ale 2025-12-31 (středa) → týden 1 roku 2026 (!)
//
// Příklad: isoWeekAndYear("2026-05-11") → { year: 2026, weekNumber: 20 }
function isoWeekAndYear(dateString) {
  const date = new Date(dateString + "T00:00:00Z");

  // Vytvoříme kopii data v UTC (bez vlivu časového pásma)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  // (getUTCDay() + 6) % 7 převede neděli=0..sobota=6 na pondělí=0..neděle=6
  // Tím zarovnáme na ISO týden začínající pondělím
  const dayNum = (target.getUTCDay() + 6) % 7;

  // Posuneme datum na čtvrtek aktuálního týdne (ISO algoritmus)
  // Čtvrtek je klíčový - určuje, do jakého roku týden patří
  target.setUTCDate(target.getUTCDate() - dayNum + 3);

  // Najdeme první čtvrtek daného roku (= začátek týdne 1)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));

  // Rozdíl v dnech mezi naším čtvrtkem a prvním čtvrtkem roku
  const diff = (target - firstThursday) / 86400000; // 86400000 ms = 1 den

  // Výpočet čísla týdne
  const weekNumber = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);

  return { year: target.getUTCFullYear(), weekNumber };
}

// Vrátí datum pondělí v týdnu daného data jako "YYYY-MM-DD".
// Pokud pošleme středu, vrátí pondělí téhož týdne.
// Příklad: mondayOfWeek("2026-05-13") → "2026-05-11"
function mondayOfWeek(dateString) {
  const d = new Date(dateString + "T00:00:00Z");

  // dayNum = kolik dní od pondělí (0=pondělí, 6=neděle)
  const dayNum = (d.getUTCDay() + 6) % 7;

  // Odečtením dayNum dní se dostaneme zpět na pondělí
  d.setUTCDate(d.getUTCDate() - dayNum);

  // toISOString() vrátí "2026-05-11T00:00:00.000Z"
  // .substring(0, 10) vezme jen první 10 znaků = "2026-05-11"
  return d.toISOString().substring(0, 10);
}

// Přičte k datu zadaný počet dní a vrátí jako "YYYY-MM-DD".
// Příklad: addDays("2026-05-11", 2) → "2026-05-13"
function addDays(dateString, days) {
  const d = new Date(dateString + "T00:00:00Z");

  // setUTCDate() nastaví den v měsíci. JavaScript automaticky přetéká
  // přes konec měsíce - addDays("2026-05-31", 1) správně vrátí "2026-06-01"
  d.setUTCDate(d.getUTCDate() + days);

  return d.toISOString().substring(0, 10);
}

module.exports = {
  dayOfWeek,
  isoWeekAndYear,
  mondayOfWeek,
  addDays,
};
