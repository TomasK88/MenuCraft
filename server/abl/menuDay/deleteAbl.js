// =====================================================
// abl/menuDay/deleteAbl.js - smazání MenuDay záznamu
// -----------------------------------------------------
// POST /menuDay/delete
// Tělo požadavku (JSON): { "id": "..." }
//
// Slouží primárně pro testování a správu dat.
// Smaže jeden konkrétní MenuDay - funguje pro DRAFT i PUBLISHED.
// V běžném provozu uživatel MenuDay záznamy nemaže - zůstávají
// jako historické záznamy pro pozdější přehled.
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

    // Smažeme soubor přes DAO. DAO vrátí {} i když soubor neexistoval
    // (ENOENT ignoruje) - mazání neexistujícího záznamu není chyba.
    menuDayDao.remove(reqParams.id);

    // Prázdná úspěšná odpověď
    res.json({});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = DeleteAbl;
