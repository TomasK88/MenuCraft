// =====================================================
// abl/dish/deleteAbl.js - smazání jídla
// -----------------------------------------------------
// POST /dish/delete
// Tělo požadavku (JSON):
//   { "id": "a3f12b8c..." }
//
// Ochrana referenční integrity:
//   Pokud je jídlo použito v jakémkoliv MenuDay (ať DRAFT
//   nebo PUBLISHED), mazání se ZABLOKUJE a vrátí se chyba.
//   Důvod: smazáním by vznikly "visící" vazby - MenuDay
//   by odkazoval na neexistující jídlo.
//   Řešení pro uživatele: nastavit isActive=false místo mazání.
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

// Potřebujeme oba DAO - dishDao pro samotné smazání
// a menuDayDao pro kontrolu, zda na jídlo někdo neodkazuje
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

    // Validace - id je povinné
    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Zkontrolujeme referenční integritu - hledáme MenuDay záznamy,
    // které odkazují na toto jídlo přes pole dishes[].dishId
    const usedIn = menuDayDao.listByDishId(reqParams.id);

    if (usedIn.length) {
      // Jídlo se nesmí smazat - vrátíme seznam id MenuDay záznamů,
      // které ho využívají, aby uživatel věděl, kde je použito
      res.status(400).json({
        code: "dishUsedInMenuDay",
        message: "Dish nelze smazat, protože je použit v existujícím menu. Nastav isActive=false.",
        usedInMenuDayIds: usedIn.map((md) => md.id), // .map() extrahuje jen id z každého objektu
      });
      return;
    }

    // Jídlo nikde není použito - bezpečně ho smažeme
    dishDao.remove(reqParams.id);

    // Odpověď je prázdný objekt - operace proběhla úspěšně, není co vracet
    res.json({});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
