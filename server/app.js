// =====================================================
// app.js - hlavní vstupní bod celého backendu
// -----------------------------------------------------
// Tento soubor se spouští příkazem "node app.js".
// Jeho úkolem je:
//   1) Vytvořit Express aplikaci (HTTP server)
//   2) Zaregistrovat middleware (CORS, JSON parsing)
//   3) Připojit routery (controllery) pro každou entitu
//   4) Spustit server na daném portu
// =====================================================

// Express je Node.js framework pro tvorbu HTTP serverů.
// Bez něj bychom museli psát spoustu kódu ručně (parsování URL,
// metod, hlaviček atd.). Express to řeší za nás.
const express = require("express");

// cors = Cross-Origin Resource Sharing. Prohlížeč ve výchozím stavu
// blokuje požadavky z jiné domény (např. frontend na localhost:5173
// volá backend na localhost:8888). Middleware cors toto povolí.
const cors = require("cors");

// Vytvoříme instanci Express aplikace. Přes proměnnou "app" pak
// registrujeme vše - middleware, routy, nastavení serveru.
const app = express();

// Port, na kterém server naslouchá příchozím požadavkům.
const port = 8888;

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
// CONTROLLERY (routery)
// Každý controller je samostatný Express Router, který sdružuje
// endpointy pro jednu entitu (Dish, MenuDay).
// -------------------------------------------------------
const dishController = require("./controller/dish");
const menuDayController = require("./controller/menuDay");

// Jednoduchá uvítací stránka na kořenové URL "/".
// Slouží jen k rychlému ověření, že server běží - otevřeš
// v prohlížeči http://localhost:8888/ a uvidíš text.
app.get("/", (req, res) => {
  res.send("MenuCraft backend běží. Použij /dish a /menuDay endpointy.");
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
});
