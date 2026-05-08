// =====================================================
// controller/dish.js - router pro entitu Dish
// -----------------------------------------------------
// Mapuje HTTP endpointy na ABL funkce.
// Obsahuje také @openapi JSDoc komentáře pro Swagger UI.
//
// Architektura: Controller → ABL → DAO
// =====================================================

const express = require("express");
const router = express.Router();

const CreateAbl = require("../abl/dish/createAbl");
const GetAbl = require("../abl/dish/getAbl");
const ListAbl = require("../abl/dish/listAbl");
const UpdateAbl = require("../abl/dish/updateAbl");
const DeleteAbl = require("../abl/dish/deleteAbl");

// -------------------------------------------------------
// Swagger: definice sdíleného schématu Dish.
// $defs (nebo components/schemas) umožňuje definovat schéma
// jednou a pak ho referencovat pomocí $ref - DRY princip.
// -------------------------------------------------------

/**
 * @openapi
 * components:
 *   schemas:
 *     Dish:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: a3f12b8c9d4e5f6a7b8c9d0e
 *         name:
 *           type: string
 *           example: Svíčková na smetaně
 *         category:
 *           type: string
 *           enum: [SOUP, MAIN_COURSE]
 *           example: MAIN_COURSE
 *         price:
 *           type: number
 *           example: 149
 *         description:
 *           type: string
 *           example: Hovězí svíčková s houskovým knedlíkem
 *         allergens:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 7]
 *         isActive:
 *           type: boolean
 *           example: true
 */

// -------------------------------------------------------
// GET /dish/get
// -------------------------------------------------------

/**
 * @openapi
 * /dish/get:
 *   get:
 *     summary: Načte jedno jídlo podle id
 *     tags:
 *       - Dish
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id jídla
 *         example: a3f12b8c9d4e5f6a7b8c9d0e
 *     responses:
 *       200:
 *         description: Nalezené jídlo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Jídlo nebylo nalezeno
 */
router.get("/get", GetAbl);

// -------------------------------------------------------
// GET /dish/list
// -------------------------------------------------------

/**
 * @openapi
 * /dish/list:
 *   get:
 *     summary: Výpis všech jídel (s volitelným filtrem)
 *     tags:
 *       - Dish
 *     parameters:
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SOUP, MAIN_COURSE]
 *         description: Filtr podle kategorie
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filtr podle aktivního stavu
 *     responses:
 *       200:
 *         description: Seznam jídel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 itemList:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 */
router.get("/list", ListAbl);

// -------------------------------------------------------
// POST /dish/create
// -------------------------------------------------------

/**
 * @openapi
 * /dish/create:
 *   post:
 *     summary: Vytvoří nové jídlo v knihovně
 *     tags:
 *       - Dish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Svíčková na smetaně
 *               category:
 *                 type: string
 *                 enum: [SOUP, MAIN_COURSE]
 *                 example: MAIN_COURSE
 *               price:
 *                 type: number
 *                 example: 149
 *               description:
 *                 type: string
 *                 example: Hovězí svíčková s houskovým knedlíkem
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 7]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Vytvořené jídlo (včetně vygenerovaného id)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Neplatný vstup nebo duplicitní název
 */
router.post("/create", CreateAbl);

// -------------------------------------------------------
// POST /dish/update
// -------------------------------------------------------

/**
 * @openapi
 * /dish/update:
 *   post:
 *     summary: Upraví existující jídlo (lze poslat jen měněné atributy)
 *     tags:
 *       - Dish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: a3f12b8c9d4e5f6a7b8c9d0e
 *               name:
 *                 type: string
 *                 example: Svíčková na smetaně
 *               category:
 *                 type: string
 *                 enum: [SOUP, MAIN_COURSE]
 *               price:
 *                 type: number
 *                 example: 155
 *               description:
 *                 type: string
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Aktualizované jídlo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Jídlo nebylo nalezeno
 */
router.post("/update", UpdateAbl);

// -------------------------------------------------------
// POST /dish/delete
// -------------------------------------------------------

/**
 * @openapi
 * /dish/delete:
 *   post:
 *     summary: Smaže jídlo (pouze pokud není použito v žádném MenuDay)
 *     tags:
 *       - Dish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: a3f12b8c9d4e5f6a7b8c9d0e
 *     responses:
 *       200:
 *         description: Jídlo bylo smazáno
 *       400:
 *         description: Jídlo nelze smazat - je použito v existujícím menu
 */
router.post("/delete", DeleteAbl);

module.exports = router;
