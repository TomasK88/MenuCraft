// =====================================================
// ABL: MenuDay - GET (načtení jednoho MenuDay podle id)
// -----------------------------------------------------
// GET /menuDay/get?id=<menuDayId>
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

async function GetAbl(req, res) {
  try {
    const reqParams = req.query?.id ? req.query : req.body;

    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    const menuDay = menuDayDao.get(reqParams.id);
    if (!menuDay) {
      res.status(404).json({
        code: "menuDayNotFound",
        message: `MenuDay with id ${reqParams.id} not found`,
      });
      return;
    }

    res.json(menuDay);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = GetAbl;
