// =====================================================
// abl/dish/getAbl.js - načtení jednoho jídla podle id
// -----------------------------------------------------
// GET /dish/get?id=<dishId>
//
// Id jídla se předává jako query parametr v URL:
//   /dish/get?id=a3f12b8c...
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
    // Query parametry jsou v req.query (část URL za "?").
    // Například URL /dish/get?id=abc → req.query = { id: "abc" }
    //
    // Ternární výraz: pokud req.query obsahuje id, použijeme query,
    // jinak zkusíme req.body (pro případ, že by někdo volal POST s tělem).
    // req.query?.id - operátor ?. ("optional chaining") bezpečně přistoupí
    // k property id, i kdyby req.query bylo undefined - nevyhodí chybu.
    const reqParams = req.query?.id ? req.query : req.body;

    // Validujeme - id musí být neprázdný řetězec
    const valid = ajv.validate(schema, reqParams);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Načteme jídlo z DAO. Vrátí objekt nebo null (pokud neexistuje).
    const dish = dishDao.get(reqParams.id);

    // Pokud DAO vrátilo null, jídlo s tímto id neexistuje
    if (!dish) {
      // HTTP 404 Not Found = hledaný zdroj neexistuje
      res.status(404).json({
        code: "dishNotFound",
        message: `Dish with id ${reqParams.id} not found`,
      });
      return;
    }

    // Jídlo nalezeno - vrátíme ho jako JSON
    res.json(dish);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = GetAbl;
