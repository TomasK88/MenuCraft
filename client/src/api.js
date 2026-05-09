// =====================================================
// api.js - komunikace s backendem (HTTP requesty)
// -----------------------------------------------------
// Všechna volání na backend jsou zde na jednom místě.
// Komponenty a stránky nemusí znát URL ani formát dat -
// zavolají funkci z tohoto souboru a dostanou hotová data.
//
// Výhoda: Pokud se změní URL nebo formát odpovědi,
// opravíme to jen zde, ne v každé komponentě zvlášť.
// =====================================================

import { API_BASE } from "./constants";

// -------------------------------------------------------
// Interní pomocná funkce - základ pro všechny requesty
// -------------------------------------------------------

// Obaluje fetch() a přidává společné chování:
//   - Nastaví Content-Type: application/json header
//   - Zkontroluje, zda odpověď není chybová (res.ok)
//   - Parsuje JSON tělo odpovědi
//   - Vyhodí Error s popisem, aby ho mohl zachytit volající (try/catch)
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    // Spread operátor sloučí výchozí header s případnými dalšími options
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  // res.ok je true pro HTTP 200-299. Jiné kódy (400, 404, 500...) = chyba.
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

  return data;
}

// =====================================================
// DISH - funkce pro práci s knihovnou jídel
// =====================================================

// Vrátí seznam jídel. Volitelný filtr: { category: "SOUP", isActive: true }
// URLSearchParams převede objekt na query string: "category=SOUP&isActive=true"
export function getDishList(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/dish/list${q ? "?" + q : ""}`);
}

// Vrátí jedno jídlo podle id
export function getDish(id) {
  return request(`/dish/get?id=${id}`);
}

// Vytvoří nové jídlo. body = { name, category, price, description, allergens, isActive }
export function createDish(body) {
  return request("/dish/create", { method: "POST", body: JSON.stringify(body) });
}

// Upraví existující jídlo. body musí obsahovat id + měněné atributy.
export function updateDish(body) {
  return request("/dish/update", { method: "POST", body: JSON.stringify(body) });
}

// Smaže jídlo. Selže, pokud je jídlo použito v nějakém MenuDay.
export function deleteDish(id) {
  return request("/dish/delete", { method: "POST", body: JSON.stringify({ id }) });
}

// =====================================================
// MENU DAY - funkce pro práci s týdenním menu
// =====================================================

// Vrátí seznam MenuDay objektů. Volitelný filtr: { year, weekNumber, status, date }
export function getMenuDayList(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/menu-day/list${q ? "?" + q : ""}`);
}

// UC01: Vygeneruje 5 MenuDay objektů (Po–Pá) ve stavu DRAFT.
// body = { weekStartDate: "2026-05-11", soupCount: 1, mainCourseCount: 3 }
export function generateMenu(body) {
  return request("/menu-day/generate", { method: "POST", body: JSON.stringify(body) });
}

// UC03: Schválí celý týden (změní všechny DRAFT → PUBLISHED).
// body = { year: 2026, weekNumber: 20 }
export function approveMenu(body) {
  return request("/menu-day/approve", { method: "POST", body: JSON.stringify(body) });
}

// UC02: Zamění jídlo v jednom dni. body = { id, dishes: [...] }
export function updateMenuDay(body) {
  return request("/menu-day/update", { method: "POST", body: JSON.stringify(body) });
}

// Smaže jeden MenuDay záznam (pro reset před přegenerováním)
export function deleteMenuDay(id) {
  return request("/menu-day/delete", { method: "POST", body: JSON.stringify({ id }) });
}
