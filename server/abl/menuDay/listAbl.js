// =====================================================
// ABL: MenuDay - LIST (výpis MenuDay objektů)
// -----------------------------------------------------
// GET /menuDay/list                                   - vše
// GET /menuDay/list?year=2026&weekNumber=20           - jeden týden
// GET /menuDay/list?status=DRAFT                      - jen drafty
// GET /menuDay/list?date=2026-05-11                   - jeden den
// =====================================================

const menuDayDao = require("../../dao/menuDay-dao.js");

async function ListAbl(req, res) {
  try {
    const filter = {};
    if (req.query.year !== undefined) filter.year = parseInt(req.query.year, 10);
    if (req.query.weekNumber !== undefined)
      filter.weekNumber = parseInt(req.query.weekNumber, 10);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;

    const itemList = menuDayDao.list(filter);
    res.json({ itemList });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;
