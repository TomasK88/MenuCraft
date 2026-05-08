// =====================================================
// abl/dish/createAbl.js - vytvoření nového jídla
// -----------------------------------------------------
// ABL (Application Business Layer) obsahuje business logiku
// pro jednu operaci. Dostane HTTP požadavek, zvaliduje vstup,
// provede operaci přes DAO a pošle odpověď.
//
// POST /dish/create
// Tělo požadavku (JSON):
//   {
//     "name": "Svíčková na smetaně",   // povinné
//     "category": "MAIN_COURSE",        // povinné: SOUP | MAIN_COURSE
//     "price": 149,                      // povinné: cena v Kč (>=0)
//     "description": "Hovězí...",        // volitelné
//     "allergens": [1, 7],               // volitelné: EU kódy 1-14
//     "isActive": true                   // volitelné: výchozí true
//   }
// =====================================================

// AJV = Another JSON Validator. Knihovna pro validaci vstupních dat
// pomocí JSON Schema standardu. Ověří, že přišla správná data ještě
// před tím, než se pokusíme cokoliv uložit.
const Ajv = require("ajv");
const ajv = new Ajv();

// DAO zajišťuje ukládání a čtení dat. ABL neví, jak přesně DAO
// ukládá data (soubory, databáze...) - jen ho zavolá.
const dishDao = require("../../dao/dish-dao.js");

// JSON Schema definuje, jak musí vypadat platný vstup (dtoIn).
// AJV porovná příchozí data s tímto schématem a vrátí chyby,
// pokud se neshodují.
const schema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },          // neprázdný řetězec
    category: { type: "string", enum: ["SOUP", "MAIN_COURSE"] }, // jen tyto dvě hodnoty
    price: { type: "number", minimum: 0 },            // číslo >= 0
    description: { type: "string" },                  // libovolný řetězec
    allergens: {
      type: "array",
      items: { type: "integer", minimum: 1, maximum: 14 }, // čísla 1-14
    },
    isActive: { type: "boolean" },                    // true nebo false
  },
  required: ["name", "category", "price"],  // tato pole MUSÍ být přítomna
  additionalProperties: false,              // zakáže jakékoliv jiné klíče v objektu
};

// Hlavní funkce - Express ji zavolá při příchodu POST /dish/create.
// Parametry req (request) a res (response) jsou standardní Express objekty:
//   req.body = tělo požadavku (objekt z JSON)
//   res.json() = pošle JSON odpověď
//   res.status(400) = nastaví HTTP stavový kód chyby
async function CreateAbl(req, res) {
  try {
    // Přečteme tělo požadavku - to je objekt parsovaný z JSON,
    // který middleware express.json() v app.js připravil za nás
    const dish = req.body;

    // 1) Validace vstupu pomocí JSON Schema
    // ajv.validate() vrátí true/false a případné chyby uloží do ajv.errors
    const valid = ajv.validate(schema, dish);
    if (!valid) {
      // HTTP 400 Bad Request = klient poslal špatná data
      // Vrátíme strukturovanou chybovou odpověď s detaily validace
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,  // pole s popisem co přesně je špatně
      });
      return; // ukončíme funkci - odpověď je odeslána, dál nepokračujeme
    }

    // 2) Doplníme výchozí hodnoty pro volitelná pole, která nebyla zaslána
    if (dish.isActive === undefined) dish.isActive = true;
    if (!dish.allergens) dish.allergens = [];

    // 3) Uložíme nové jídlo přes DAO
    // Používáme vnitřní try/catch protože DAO může vyhodit svou vlastní chybu
    // (např. duplicitní název), kterou chceme zobrazit jako 400, ne jako 500
    let created;
    try {
      created = dishDao.create(dish);
    } catch (e) {
      // Spread operátor { ...e } rozbalí vlastnosti chybového objektu
      // (code, message) do odpovědi
      res.status(400).json({ ...e });
      return;
    }

    // 4) Úspěch - pošleme zpět vytvořený objekt (včetně vygenerovaného id)
    res.json(created);
  } catch (e) {
    // Neočekávaná chyba (programátorská chyba, disk plný atd.)
    // HTTP 500 Internal Server Error
    res.status(500).json({ message: e.message });
  }
}

module.exports = CreateAbl;
