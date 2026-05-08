// =====================================================
// abl/dish/listAbl.js - výpis všech jídel
// -----------------------------------------------------
// GET /dish/list                       → všechna jídla
// GET /dish/list?category=SOUP         → jen polévky
// GET /dish/list?category=MAIN_COURSE  → jen hlavní jídla
// GET /dish/list?isActive=true         → jen aktivní jídla
// GET /dish/list?isActive=false        → jen neaktivní jídla
//
// Filtry lze kombinovat: ?category=SOUP&isActive=true
//
// Odpověď má tvar: { "itemList": [ ...pole jídel... ] }
// Obalení do objektu s itemList je konvence - umožňuje
// v budoucnu přidat metadata (celkový počet, stránkování atd.)
// =====================================================

const dishDao = require("../../dao/dish-dao.js");

// List nemá povinné parametry, proto zde není AJV validace.
// Všechny filtry jsou volitelné.
async function ListAbl(req, res) {
  try {
    // Sestavíme objekt filtru z query parametrů URL.
    // Začínáme s prázdným objektem - přidáme jen ty filtry, které přišly.
    const filter = {};

    // Pokud byl zadán filtr category, přidáme ho.
    // req.query.category je string (nebo undefined, pokud nebyl zadán).
    if (req.query.category) filter.category = req.query.category;

    // isActive v URL přichází jako text ("true"/"false"), ale DAO
    // pracuje s boolean. Proto převádíme: řetězec "true" → boolean true.
    // Podmínka !== undefined zajistí, že přidáme filtr jen pokud byl zadán.
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    // Zavoláme DAO s filtrem. Bez filtru vrátí vše.
    const dishList = dishDao.list(filter);

    // Vrátíme výsledek zabalený do objektu s klíčem itemList
    res.json({ itemList: dishList });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;
