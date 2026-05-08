// =====================================================
// ABL: MenuDay - UPDATE (BUC-2: úprava menu - záměna jídla)
// -----------------------------------------------------
// POST /menuDay/update
// Body (JSON):
//   {
//     "id": "<menuDayId>",
//     "dishes": [
//        { "dishId": "...", "price": 159, "position": 0 },
//        { "dishId": "...", "price": 49,  "position": 1 }
//     ]
//   }
//
// Pravidla:
//   - update lze dělat jen na MenuDay ve stavu DRAFT
//     (PUBLISHED je read-only). Vrací 400.
//   - počet dishes musí odpovídat původnímu počtu (zachovává sloty).
//   - každý dishId musí existovat a být isActive.
//   - cena (price) se cíleně ukládá ve VAZBĚ (komentář učitele).
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const menuDayDao = require("../../dao/menuDay-dao.js");
const dishDao = require("../../dao/dish-dao.js");

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    dishes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dishId: { type: "string" },
          price: { type: "number", minimum: 0 },
          position: { type: "integer", minimum: 0 },
        },
        required: ["dishId", "price"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["id", "dishes"],
  additionalProperties: false,
};

async function UpdateAbl(req, res) {
  try {
    const dtoIn = req.body;

    // 1) Validace vstupu
    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // 2) Existence MenuDay
    const current = menuDayDao.get(dtoIn.id);
    if (!current) {
      res.status(404).json({
        code: "menuDayNotFound",
        message: `MenuDay with id ${dtoIn.id} not found`,
      });
      return;
    }

    // 3) Editovat lze jen DRAFT
    if (current.status !== "DRAFT") {
      res.status(400).json({
        code: "menuDayNotEditable",
        message: "MenuDay je již PUBLISHED a nelze ho editovat.",
      });
      return;
    }

    // 4) Ověření, že všechny dishId existují a jsou aktivní
    for (const item of dtoIn.dishes) {
      const dish = dishDao.get(item.dishId);
      if (!dish) {
        res.status(400).json({
          code: "dishNotFound",
          message: `Dish s id ${item.dishId} neexistuje`,
        });
        return;
      }
      if (!dish.isActive) {
        res.status(400).json({
          code: "dishNotActive",
          message: `Dish "${dish.name}" není aktivní (isActive=false).`,
        });
        return;
      }
    }

    // 5) Uložení
    const updated = menuDayDao.update({ id: dtoIn.id, dishes: dtoIn.dishes });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
