// =====================================================
// abl/menuDay/listAbl.js - výpis MenuDay objektů
// -----------------------------------------------------
// GET /menu-day/list                          → vše
// GET /menu-day/list?year=2026&weekNumber=20  → konkrétní týden
// GET /menu-day/list?status=DRAFT             → jen drafty
// GET /menu-day/list?date=2026-05-11          → konkrétní den
//
// Filtry lze kombinovat libovolně.
// =====================================================

const menuDayDao = require("../../dao/menuDay-dao.js");

async function ListAbl(req, res) {
  try {
    const filter = {};

    // year a weekNumber přicházejí jako text, ale DAO pracuje s čísly.
    // parseInt(value, 10) převede textový řetězec na celé číslo v desítkové soustavě.
    // Číslo 10 = základ číselné soustavy (10 = desítková, 16 = hex, 2 = binární).
    if (req.query.year !== undefined) filter.year = parseInt(req.query.year, 10);
    if (req.query.weekNumber !== undefined) filter.weekNumber = parseInt(req.query.weekNumber, 10);

    // status a date jsou řetězce - předáme přímo bez konverze
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;

    const itemList = menuDayDao.list(filter);

    // Vrátíme zabalené do itemList objektu (konvence pro seznam)
    res.json({ itemList });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;
