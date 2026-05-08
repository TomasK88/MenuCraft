// =====================================================
// ABL: Dish - GET (načtení jednoho jídla podle id)
// -----------------------------------------------------
// GET /dish/get?id=<dishId>
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();
const dishDao = require("../../dao/dish-dao.js");

const schema = {
  type: "object",
  properties: { id: { type: "string" } },
  required: ["id"],
  additionalProperties: false,
};

async function GetAbl(req, res) {
  try {
    // dotaz může přijít buď v query (GET) nebo v body (POST)
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

    const dish = dishDao.get(reqParams.id);
    if (!dish) {
      res.status(404).json({
        code: "dishNotFound",
        message: `Dish with id ${reqParams.id} not found`,
      });
      return;
    }

    res.json(dish);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = GetAbl;
