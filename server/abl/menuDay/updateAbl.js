// =====================================================
// abl/menuDay/updateAbl.js - záměna jídla v menu (UC02)
// -----------------------------------------------------
// POST /menuDay/update
// Tělo požadavku (JSON):
//   {
//     "id": "<menuDayId>",
//     "dishes": [
//       { "dishId": "...", "position": 0 },
//       { "dishId": "...", "position": 1 }
//     ]
//   }
//
// Pravidla:
//   - Editovat lze POUZE MenuDay ve stavu DRAFT.
//     PUBLISHED menu je read-only (finální, zveřejněné).
//   - Každé dishId musí existovat v knihovně a být aktivní.
//   - Cena (price) se NEPOSÍLÁ v požadavku - backend ji doplní
//     automaticky z aktuálního ceníku jídla (dish.price).
//     Díky tomu frontend nemusí znát ceny a cena je vždy aktuální.
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const menuDayDao = require("../../dao/menuDay-dao.js");
const dishDao = require("../../dao/dish-dao.js");

// Schéma validuje jak id MenuDay, tak strukturu každé vazby v dishes.
// Cena (price) zde záměrně NENÍ - backend ji doplní sám z katalogu jídel.
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
          position: { type: "integer", minimum: 0 },
        },
        required: ["dishId"],
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

    // 4) Ověříme každé jídlo a doplníme cenu z katalogu.
    //    Výsledkem bude pole dishes se správnou strukturou { dishId, price, position }.
    //
    //    Procházíme přes for...of místo .forEach(), protože chceme moci
    //    použít return pro předčasné ukončení funkce při chybě.
    const dishesWithPrice = [];
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

      // Sestavíme finální objekt jídla:
      //   - dishId a position přicházejí z requestu
      //   - price doplníme z aktuálního katalogu (snapshot v okamžiku záměny)
      dishesWithPrice.push({
        dishId: item.dishId,
        price: dish.price,
        position: item.position ?? dishesWithPrice.length,
      });
    }

    // 5) Vše v pořádku - uložíme dishes s doplněnými cenami.
    //    DAO update přepíše jen pole dishes, ostatní atributy (status, date...) zůstanou.
    const updated = menuDayDao.update({ id: dtoIn.id, dishes: dishesWithPrice });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
