// =====================================================
// controller/menuDay.js - router pro entitu MenuDay
// =====================================================

const express = require("express");
const router = express.Router();

const GenerateAbl = require("../abl/menuDay/generateAbl");
const GetAbl = require("../abl/menuDay/getAbl");
const ListAbl = require("../abl/menuDay/listAbl");
const UpdateAbl = require("../abl/menuDay/updateAbl");
const ApproveAbl = require("../abl/menuDay/approveAbl");
const DeleteAbl = require("../abl/menuDay/deleteAbl");

// -------------------------------------------------------
// Swagger: sdílené schéma MenuDay
// -------------------------------------------------------

/**
 * @openapi
 * components:
 *   schemas:
 *     DishRef:
 *       type: object
 *       description: Vazba MenuDay na jídlo (obsahuje snapshot ceny)
 *       properties:
 *         dishId:
 *           type: string
 *           example: a3f12b8c9d4e5f6a7b8c9d0e
 *         price:
 *           type: number
 *           example: 149
 *         position:
 *           type: integer
 *           example: 0
 *     MenuDay:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: b5c23d9e0f1a2b3c4d5e6f7a
 *         date:
 *           type: string
 *           example: "2026-05-11"
 *         dayOfWeek:
 *           type: string
 *           enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY]
 *           example: MONDAY
 *         weekNumber:
 *           type: integer
 *           example: 20
 *         year:
 *           type: integer
 *           example: 2026
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 *           example: DRAFT
 *         dishes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DishRef'
 *         generatedAt:
 *           type: string
 *           example: "2026-05-08T10:00:00.000Z"
 *         approvedAt:
 *           type: string
 *           nullable: true
 *           example: null
 */

// -------------------------------------------------------
// GET /menuDay/get
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/get:
 *   get:
 *     summary: Načte jeden MenuDay podle id
 *     tags:
 *       - MenuDay
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: b5c23d9e0f1a2b3c4d5e6f7a
 *     responses:
 *       200:
 *         description: Nalezený MenuDay
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuDay'
 *       404:
 *         description: MenuDay nebylo nalezeno
 */
router.get("/get", GetAbl);

// -------------------------------------------------------
// GET /menuDay/list
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/list:
 *   get:
 *     summary: Výpis MenuDay objektů (s volitelnými filtry)
 *     tags:
 *       - MenuDay
 *     parameters:
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         example: 2026
 *       - in: query
 *         name: weekNumber
 *         required: false
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *         example: "2026-05-11"
 *     responses:
 *       200:
 *         description: Seznam MenuDay objektů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 itemList:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuDay'
 */
router.get("/list", ListAbl);

// -------------------------------------------------------
// POST /menuDay/generate
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/generate:
 *   post:
 *     summary: "UC01: Vygeneruje týdenní menu (5x MenuDay ve stavu DRAFT)"
 *     tags:
 *       - MenuDay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStartDate
 *               - soupCount
 *               - mainCourseCount
 *             properties:
 *               weekStartDate:
 *                 type: string
 *                 description: Pondělí daného týdne (YYYY-MM-DD)
 *                 example: "2026-05-11"
 *               soupCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 1
 *               mainCourseCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 3
 *     responses:
 *       200:
 *         description: 5 vygenerovaných MenuDay objektů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 itemList:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuDay'
 *       400:
 *         description: Nedostatek aktivních jídel v knihovně
 */
router.post("/generate", GenerateAbl);

// -------------------------------------------------------
// POST /menuDay/update
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/update:
 *   post:
 *     summary: "UC02: Záměna jídla v DRAFT menu"
 *     tags:
 *       - MenuDay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - dishes
 *             properties:
 *               id:
 *                 type: string
 *                 example: b5c23d9e0f1a2b3c4d5e6f7a
 *               dishes:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/DishRef'
 *     responses:
 *       200:
 *         description: Aktualizovaný MenuDay
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuDay'
 *       400:
 *         description: MenuDay není ve stavu DRAFT nebo dishId neexistuje
 *       404:
 *         description: MenuDay nebylo nalezeno
 */
router.post("/update", UpdateAbl);

// -------------------------------------------------------
// POST /menuDay/approve
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/approve:
 *   post:
 *     summary: "UC03: Schválí celý týden (DRAFT → PUBLISHED)"
 *     tags:
 *       - MenuDay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - weekNumber
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2026
 *               weekNumber:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: 5 schválených MenuDay objektů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 itemList:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuDay'
 *       400:
 *         description: Týden nemá 5 dní nebo některý den není DRAFT
 */
router.post("/approve", ApproveAbl);

// -------------------------------------------------------
// POST /menuDay/delete
// -------------------------------------------------------

/**
 * @openapi
 * /menuDay/delete:
 *   post:
 *     summary: Smaže jeden MenuDay záznam
 *     tags:
 *       - MenuDay
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
 *                 example: b5c23d9e0f1a2b3c4d5e6f7a
 *     responses:
 *       200:
 *         description: Záznam byl smazán
 */
router.post("/delete", DeleteAbl);

module.exports = router;
