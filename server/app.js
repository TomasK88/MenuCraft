// =====================================================
// app.js - hlavní vstupní bod celého backendu
// -----------------------------------------------------
// Tento soubor se spouští příkazem "node app.js".
// Jeho úkolem je:
//   1) Vytvořit Express aplikaci (HTTP server)
//   2) Zaregistrovat middleware (CORS, JSON parsing)
//   3) Připojit routery (controllery) pro každou entitu
//   4) Zpřístupnit Swagger UI dokumentaci na /swagger
//   5) Spustit server na daném portu
// =====================================================

const express = require("express");
const cors = require("cors");

// swagger-jsdoc čte JSDoc komentáře (@openapi) ze zdrojových souborů
// a sestaví z nich jeden OpenAPI 3.0 objekt.
const swaggerJsdoc = require("swagger-jsdoc");

// swagger-ui-express zobrazí OpenAPI objekt jako interaktivní HTML stránku
// kde lze endpointy rovnou volat přímo z prohlížeče.
const swaggerUi = require("swagger-ui-express");

// Vytvoříme instanci Express aplikace. Přes proměnnou "app" pak
// registrujeme vše - middleware, routy, nastavení serveru.
const app = express();

const port = 3000;

// -------------------------------------------------------
// SWAGGER / OpenAPI konfigurace
// -------------------------------------------------------

// Základní informace o API + cesty k souborům s @openapi komentáři
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MenuCraft API",
      version: "1.0.0",
      description: "Backend API pro správu jídel a generování týdenního poledního menu.",
    },
    servers: [{ url: `http://localhost:${port}`, description: "Lokální vývojový server" }],
  },
  // swagger-jsdoc prohledá všechny JS soubory v controller/ složce
  // a najde v nich komentáře začínající @openapi
  apis: ["./controller/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// -------------------------------------------------------
// MIDDLEWARE
// Middleware jsou funkce, které se spustí pro každý příchozí
// požadavek PŘED tím, než ho zpracuje konkrétní endpoint.
// Registrují se přes app.use() a volají se v pořadí, v jakém
// jsou zaregistrovány.
// -------------------------------------------------------

// Povolí CORS pro všechny požadavky ze všech domén.
// V produkci bychom omezili jen na konkrétní frontendovou URL.
app.use(cors());

// Automaticky parsuje JSON tělo (body) příchozích POST požadavků.
// Bez tohoto by req.body bylo undefined.
// Např. { "name": "Svíčková" } v body → req.body.name === "Svíčková"
app.use(express.json());

// Parsuje data odeslaná přes HTML formuláře (formát application/x-www-form-urlencoded).
// extended: true umožňuje vnořené objekty v datech formuláře.
// Necháváme pro jistotu, i když API primárně používá JSON.
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------
// SWAGGER UI - interaktivní dokumentace na /swagger
// swaggerUi.serve = obsluhuje statické soubory (CSS, JS) UI
// swaggerUi.setup(spec) = inicializuje UI s naší specifikací
// -------------------------------------------------------
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// -------------------------------------------------------
// CONTROLLERY (routery)
// Každý controller je samostatný Express Router, který sdružuje
// endpointy pro jednu entitu (Dish, MenuDay).
// -------------------------------------------------------
const dishController = require("./controller/dish");
const menuDayController = require("./controller/menuDay");

app.get("/", (req, res) => {
  res.send("MenuCraft backend běží. Dokumentace: http://localhost:3000/swagger");
});

// Připojení routerů s prefixem URL:
//   /dish/*    → zpracuje dishController
//   /menuDay/* → zpracuje menuDayController
// Např. požadavek na POST /dish/create → dishController → createAbl
app.use("/dish", dishController);
app.use("/menuDay", menuDayController);

// Spuštění serveru - začne naslouchat na zadaném portu.
// Callback (šipková funkce) se zavolá jednou, jakmile je server připraven.
app.listen(port, () => {
  console.log(`MenuCraft backend naslouchá na portu ${port}`);
  console.log(`Swagger UI: http://localhost:${port}/swagger`);
});
