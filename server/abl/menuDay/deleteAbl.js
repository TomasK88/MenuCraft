// =====================================================
// ABL: MenuDay - DELETE (volitelné: smazání MenuDay)
// -----------------------------------------------------
// POST /menuDay/delete
// Body (JSON): { "id": "..." }
//
// Smaže jeden MenuDay záznam. Slouží spíš pro testování / správu;
// běžný uživatel mazat MenuDay nebude. PUBLISHED MenuDay je možné
// smazat jen explicitním nastavením force=true (tady nezavádíme,
// pro jednoduchost povolíme smazání i PUBLISHED).
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

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

    menuDayDao.remove(reqParams.id);
    res.json({});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
