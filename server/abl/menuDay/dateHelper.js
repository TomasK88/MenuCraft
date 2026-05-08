// =====================================================
// Pomocné funkce pro práci s daty
// -----------------------------------------------------
// Z data formátu "YYYY-MM-DD" odvozujeme:
//   - dayOfWeek  (MONDAY..FRIDAY)
//   - weekNumber (ISO 1..53)
//   - year       (ISO rok týdne)
// =====================================================

const DAY_NAMES = [
  "SUNDAY",   // 0
  "MONDAY",   // 1
  "TUESDAY",  // 2
  "WEDNESDAY",// 3
  "THURSDAY", // 4
  "FRIDAY",   // 5
  "SATURDAY", // 6
];

// Vrátí "MONDAY".."FRIDAY" pro pracovní den, jinak "SATURDAY"/"SUNDAY".
function dayOfWeek(dateString) {
  const d = new Date(dateString + "T00:00:00Z");
  return DAY_NAMES[d.getUTCDay()];
}

// Spočítá ISO číslo týdne (1..53) a ISO rok pro dané datum.
// ISO týden začíná pondělím; rok se občas liší (např. 2026-01-01).
function isoWeekAndYear(dateString) {
  const date = new Date(dateString + "T00:00:00Z");
  // ISO algoritmus
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // 0 = pondělí
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // posun na čtvrtek aktuálního týdne
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target - firstThursday) / 86400000; // dny rozdílu
  const weekNumber = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: target.getUTCFullYear(), weekNumber };
}

// Vrátí pondělí v týdnu daného data jako "YYYY-MM-DD".
function mondayOfWeek(dateString) {
  const d = new Date(dateString + "T00:00:00Z");
  const dayNum = (d.getUTCDay() + 6) % 7; // 0 = pondělí
  d.setUTCDate(d.getUTCDate() - dayNum);
  return d.toISOString().substring(0, 10);
}

// Přičte k datu N dní a vrátí jako "YYYY-MM-DD".
function addDays(dateString, days) {
  const d = new Date(dateString + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

module.exports = {
  dayOfWeek,
  isoWeekAndYear,
  mondayOfWeek,
  addDays,
};
