// =====================================================
// ABL: Dish - LIST (výpis všech jídel s volitelným filtrem)
// -----------------------------------------------------
// GET /dish/list                     -> všechny dishe
// GET /dish/list?category=SOUP       -> jen polévky
// GET /dish/list?isActive=true       -> jen aktivní
// =====================================================

const dishDao = require("../../dao/dish-dao.js");

async function ListAbl(req, res) {
  try {
    // přečteme volitelné filtry z query parametrů
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) {
      // query string je vždy text - převedeme na boolean
      filter.isActive = req.query.isActive === "true";
    }

    const dishList = dishDao.list(filter);
    res.json({ itemList: dishList });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ListAbl;
