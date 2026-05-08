// =====================================================
// ABL: Dish - UPDATE (úprava existujícího jídla)
// -----------------------------------------------------
// POST /dish/update
// Body (JSON):
//   { "id": "...", "name"?, "category"?, "price"?,
//     "description"?, "allergens"?, "isActive"? }
// Měnit lze libovolnou podmnožinu atributů.
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const dishDao = require("../../dao/dish-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string", minLength: 1 },
    category: { type: "string", enum: ["SOUP", "MAIN_COURSE"] },
    price: { type: "number", minimum: 0 },
    description: { type: "string" },
    allergens: {
      type: "array",
      items: { type: "integer", minimum: 1, maximum: 14 },
    },
    isActive: { type: "boolean" },
  },
  required: ["id"],
  additionalProperties: false,
};

async function UpdateAbl(req, res) {
  try {
    const dish = req.body;

    const valid = ajv.validate(schema, dish);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    let updated;
    try {
      updated = dishDao.update(dish);
    } catch (e) {
      res.status(400).json({ ...e });
      return;
    }
    if (!updated) {
      res.status(404).json({
        code: "dishNotFound",
        message: `Dish with id ${dish.id} not found`,
      });
      return;
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
