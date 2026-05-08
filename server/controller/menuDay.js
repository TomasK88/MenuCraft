// =====================================================
// controller/menuDay.js - router pro entitu MenuDay
// -----------------------------------------------------
// Stejný princip jako controller/dish.js - mapuje URL
// na ABL funkce. Viz dish.js pro vysvětlení architektury.
//
// Endpointy MenuDay:
//   GET  /menuDay/get?id=...          → načtení jednoho MenuDay
//   GET  /menuDay/list[?filtry]       → výpis (rok, týden, status, datum)
//   POST /menuDay/generate            → UC01: vygenerování týdenního menu
//   POST /menuDay/update              → UC02: záměna jídla v DRAFT menu
//   POST /menuDay/approve             → UC03: schválení celého týdne (DRAFT→PUBLISHED)
//   POST /menuDay/delete              → smazání záznamu (správa/testování)
// =====================================================

const express = require("express");
const router = express.Router();

const GenerateAbl = require("../abl/menuDay/generateAbl");
const GetAbl = require("../abl/menuDay/getAbl");
const ListAbl = require("../abl/menuDay/listAbl");
const UpdateAbl = require("../abl/menuDay/updateAbl");
const ApproveAbl = require("../abl/menuDay/approveAbl");
const DeleteAbl = require("../abl/menuDay/deleteAbl");

router.get("/get", GetAbl);
router.get("/list", ListAbl);
router.post("/generate", GenerateAbl);
router.post("/update", UpdateAbl);
router.post("/approve", ApproveAbl);
router.post("/delete", DeleteAbl);

module.exports = router;
