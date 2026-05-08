// =====================================================
// Controller pro entitu MenuDay
// -----------------------------------------------------
// Mapuje HTTP endpointy na ABL operace.
//
// Endpointy:
//   GET  /menuDay/get?id=...
//   GET  /menuDay/list[?year=&weekNumber=&status=&date=]
//   POST /menuDay/generate    -> BUC-1
//   POST /menuDay/update      -> BUC-2 (záměna jídla)
//   POST /menuDay/approve     -> BUC-3 (schválení 5 dnů)
//   POST /menuDay/delete      -> volitelné (správa)
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
