// =====================================================
// MenuCraft - hlavní vstupní bod backendu
// -----------------------------------------------------
// Spouští Express server, registruje middleware
// a připojuje controllery pro entity Dish a MenuDay.
// =====================================================

const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000; // stejný port jako v ukázkovém projektu

// --- Middleware ---
// CORS - aby šlo později volat backend z frontendu
app.use(cors());
// Parsování JSON v body (POST endpointy)
app.use(express.json());
// Parsování formulářů (pro jistotu)
app.use(express.urlencoded({ extended: true }));

// --- Controllery jednotlivých entit ---
const dishController = require("./controller/dish");
const menuDayController = require("./controller/menuDay");

// "Welcome" stránka pro rychlé ověření, že server běží
app.get("/", (req, res) => {
  res.send("MenuCraft backend běží. Použij /dish a /menuDay endpointy.");
});

// Připojení routerů. Každý router řeší jednu entitu.
app.use("/dish", dishController);
app.use("/menuDay", menuDayController);

// Spuštění serveru
app.listen(port, () => {
  console.log(`MenuCraft backend naslouchá na portu ${port}`);
});
