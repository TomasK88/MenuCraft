// =====================================================
// Controller pro entitu Dish
// -----------------------------------------------------
// Mapuje HTTP endpointy na ABL operace.
// =====================================================

const express = require("express");
const router = express.Router();

const CreateAbl = require("../abl/dish/createAbl");
const GetAbl = require("../abl/dish/getAbl");
const ListAbl = require("../abl/dish/listAbl");
const UpdateAbl = require("../abl/dish/updateAbl");
const DeleteAbl = require("../abl/dish/deleteAbl");

router.get("/get", GetAbl);
router.get("/list", ListAbl);
router.post("/create", CreateAbl);
router.post("/update", UpdateAbl);
router.post("/delete", DeleteAbl);

module.exports = router;
