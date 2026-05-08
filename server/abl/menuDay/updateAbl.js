// =====================================================
// abl/menuDay/updateAbl.js - záměna jídla v menu (UC02)
// -----------------------------------------------------
// POST /menuDay/update
// Tělo požadavku (JSON):
//   {
//     "id": "<menuDayId>",
//     "dishes": [
//       { "dishId": "...", "price": 149, "position": 0 },
//       { "dishId": "...", "price": 49,  "position": 1 }
//     ]
//   }
//
// Pravidla:
//   - Editovat lze POUZE MenuDay ve stavu DRAFT.
//     PUBLISHED menu je read-only (finální, zveřejněné).
//   - Každé dishId musí existovat v knihovně a být aktivní.
//   - Price se posílá v požadavku - uživatel může cenu
//     pro konkrétní den ručně upravit (např. slevová akce).
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const menuDayDao = require("../../dao/menuDay-dao.js");
const dishDao = require("../../dao/dish-dao.js");

// Schéma validuje jak id MenuDay, tak strukturu každé vazby v dishes
const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    dishes: {
      type: "array",
      items: {
        // Každá položka v dishes musí mít tuto strukturu
        type: "object",
        properties: {
          dishId: { type: "string" },
          price: { type: "number", minimum: 0 },
          position: { type: "integer", minimum: 0 },
        },
        required: ["dishId"], // position je volitelná
        additionalProperties: false,
      },
      minItems: 1, // dishes nesmí být prázdné pole
    },
  },
  required: ["id", "dishes"],
  additionalProperties: false,
};

async function UpdateAbl(req, res) {
  try {
    const dtoIn = req.body;

    // 1) Validace struktury vstupu
    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // 2) Ověříme, že MenuDay s tímto id existuje
    const current = menuDayDao.get(dtoIn.id);
    if (!current) {
      res.status(404).json({
        code: "menuDayNotFound",
        message: `MenuDay with id ${dtoIn.id} not found`,
      });
      return;
    }

    // 3) Editovat lze jen DRAFT - PUBLISHED je finální a read-only
    if (current.status !== "DRAFT") {
      res.status(400).json({
        code: "menuDayNotEditable",
        message: "MenuDay je již PUBLISHED a nelze ho editovat.",
      });
      return;
    }

    // 4) Ověříme, že každé zadané jídlo existuje a je aktivní.
    //    Procházíme přes for...of - styl, který umožňuje použít return/break.
    //    (Alternativa .forEach() return dovnitř cyklu nestopne celou funkci.)
    for (const item of dtoIn.dishes) {
      const dish = dishDao.get(item.dishId);

      if (!dish) {
        res.status(400).json({
          code: "dishNotFound",
          message: `Dish s id ${item.dishId} neexistuje`,
        });
        return;
      }

      // Deaktivované jídlo (isActive=false) nesmí jít do menu
      if (!dish.isActive) {
        res.status(400).json({
          code: "dishNotActive",
          message: `Dish "${dish.name}" není aktivní (isActive=false).`,
        });
        return;
      }
    }

    // 5) Vše v pořádku - uložíme nové pole dishes do MenuDay.
    //    DAO update sloučí { id, dishes } s aktuálním stavem -
    //    přepíše jen pole dishes, ostatní atributy (status, date...) zůstanou.
    const updated = menuDayDao.update({ id: dtoIn.id, dishes: dtoIn.dishes });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
