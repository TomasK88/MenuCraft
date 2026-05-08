// =====================================================
// ABL: Dish - DELETE (odstranění jídla)
// -----------------------------------------------------
// POST /dish/delete
// Body (JSON): { "id": "..." }
//
// Pokud je Dish referencován z některého MenuDay (DRAFT i PUBLISHED),
// mazání zablokujeme a vrátíme chybu (E1 v BUC-4).
// Uživatel má místo toho nastavit isActive=false.
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const dishDao = require("../../dao/dish-dao.js");
const menuDayDao = require("../../dao/menuDay-dao.js");

const schema = {
  type: "object",
  properties: { id: { type: "string" } },
  required: ["id"],
  additionalProperties: false,
};

async function DeleteAbl(req, res) {
  try {
    const reqParams = req.body;

    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Zjistíme, jestli je dish použit v nějakém MenuDay
    const usedIn = menuDayDao.listByDishId(reqParams.id);
    if (usedIn.length) {
      res.status(400).json({
        code: "dishUsedInMenuDay",
        message:
          "Dish nelze smazat, protože je použit v existujícím menu. Nastav isActive=false.",
        usedInMenuDayIds: usedIn.map((md) => md.id),
      });
      return;
    }

    dishDao.remove(reqParams.id);
    res.json({});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
