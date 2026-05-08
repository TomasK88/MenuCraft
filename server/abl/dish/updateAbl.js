// =====================================================
// abl/dish/updateAbl.js - úprava existujícího jídla
// -----------------------------------------------------
// POST /dish/update
// Tělo požadavku (JSON):
//   {
//     "id": "a3f12b8c...",   // povinné: id jídla, které chceme změnit
//     "name": "...",          // volitelné: nový název
//     "category": "...",      // volitelné: nová kategorie
//     "price": 155,           // volitelné: nová cena (např. po zdražení)
//     "description": "...",   // volitelné: nový popis
//     "allergens": [1, 3],    // volitelné: nové alergeny
//     "isActive": false       // volitelné: deaktivace jídla
//   }
//
// Posílají se jen atributy, které chceme změnit.
// Ostatní zůstanou tak jak jsou (merge v DAO).
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
  required: ["id"],            // jediné povinné pole - musíme vědět, co měníme
  additionalProperties: false, // žádné extra klíče
};

async function UpdateAbl(req, res) {
  try {
    const dish = req.body;

    // Validujeme vstup - id musí být přítomno, ostatní pole jsou volitelná
    const valid = ajv.validate(schema, dish);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Zavoláme DAO update. DAO interně:
    //   1) načte aktuální objekt ze souboru
    //   2) sloučí ho s nově příchozími daty (přepíše jen zadané atributy)
    //   3) uloží zpět do souboru
    //   4) vrátí výsledný objekt (nebo null, pokud id neexistuje)
    let updated;
    try {
      updated = dishDao.update(dish);
    } catch (e) {
      // DAO může vyhodit chybu např. při kolizi názvu
      res.status(400).json({ ...e });
      return;
    }

    // Pokud DAO vrátilo null, jídlo s tímto id neexistuje
    if (!updated) {
      res.status(404).json({
        code: "dishNotFound",
        message: `Dish with id ${dish.id} not found`,
      });
      return;
    }

    // Úspěch - vrátíme aktualizovaný objekt
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = UpdateAbl;
