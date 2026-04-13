const express = require('express');
const router = express.Router();

//const GetAbl = require('../abl/dish/getAbl');
//const ListAbl = require('../abl/dish/listAbl');
const CreateAbl = require('../abl/dish/createAbl');
//const UpdateAbl = require('../abl/dish/updateAbl');
//const DeleteAbl = require('../abl/dish/deleteAbl');

router.post("/create", CreateAbl);

module.exports = router;    