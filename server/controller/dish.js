// =====================================================
// controller/dish.js - router pro entitu Dish
// -----------------------------------------------------
// Controller (router) je prostředník mezi HTTP požadavkem
// a business logikou (ABL). Jeho jedinou odpovědností je
// namapovat dvojici HTTP metoda + URL na konkrétní ABL funkci.
//
// Architektura vrstev v tomto projektu:
//   HTTP požadavek
//     → Controller (tady) - "co se volá"
//       → ABL            - "co se má stát" (validace, logika)
//         → DAO          - "jak se to uloží" (čtení/zápis souborů)
//
// Endpointy Dish:
//   GET  /dish/get?id=...  → načtení jednoho jídla
//   GET  /dish/list        → výpis všech jídel (s filtry)
//   POST /dish/create      → vytvoření nového jídla
//   POST /dish/update      → úprava existujícího jídla
//   POST /dish/delete      → smazání jídla
// =====================================================

const express = require("express");

// Router je "mini-aplikace" uvnitř Expressu. Funguje stejně jako
// hlavní app z app.js, ale jen pro skupinu URL s daným prefixem.
// V app.js ho připojíme jako: app.use("/dish", dishController)
const router = express.Router();

// Importujeme ABL funkce - každá řeší jednu operaci
const CreateAbl = require("../abl/dish/createAbl");
const GetAbl = require("../abl/dish/getAbl");
const ListAbl = require("../abl/dish/listAbl");
const UpdateAbl = require("../abl/dish/updateAbl");
const DeleteAbl = require("../abl/dish/deleteAbl");

// Zaregistrujeme jednotlivé routy.
// router.get("cesta", funkce) = při GET požadavku na tuto cestu zavolej funkci
// router.post("cesta", funkce) = při POST požadavku na tuto cestu zavolej funkci
//
// GET používáme pro čtení dat (bezpečné, idempotentní, parametry v URL).
// POST používáme pro zápis/změny (data jdou v těle požadavku, ne v URL).
router.get("/get", GetAbl);
router.get("/list", ListAbl);
router.post("/create", CreateAbl);
router.post("/update", UpdateAbl);
router.post("/delete", DeleteAbl);

// Exportujeme router, aby ho mohl app.js zaregistrovat
module.exports = router;
