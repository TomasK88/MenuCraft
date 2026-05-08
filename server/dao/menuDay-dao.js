// =====================================================
// DAO (Data Access Object) pro entitu MenuDay
// -----------------------------------------------------
// Stejný princip jako dish-dao.js - každý MenuDay je uložen
// jako samostatný JSON soubor ve složce storage/menuDayList.
//
// Atributy MenuDay:
//   id             - jedinečný identifikátor (hex string)
//   date           - konkrétní datum dne, např. "2026-05-11" (ISO YYYY-MM-DD)
//   dayOfWeek      - "MONDAY".."FRIDAY" (odvozeno z date při generování)
//   weekNumber     - ISO číslo týdne 1..53 (odvozeno z date)
//   year           - rok (odvozeno z date)
//   status         - "DRAFT" (editovatelné) nebo "PUBLISHED" (schválené, read-only)
//   dishes         - pole vazeb na jídla: [{ dishId, price, position }, ...]
//                    price je SOUČÁSTÍ VAZBY - historický snapshot ceny
//                    v momentě generování (ne aktuální cena z Dish)
//   generatedAt    - ISO timestamp kdy bylo menu vygenerováno
//   approvedAt     - ISO timestamp schválení (null dokud je DRAFT)
//
// Proč ukládáme date, dayOfWeek, weekNumber a year zvlášť?
//   date je primární zdroj pravdy. Ostatní jsou odvozené atributy
//   uložené pro rychlý přístup bez nutnosti počítat při každém čtení.
//   Díky date lze vždy jednoznačně určit, do jakého týdne den patří
//   (vyřešeno dle komentáře učitele).
//
// Historie: MenuDay záznamy se NEPŘEPISUJÍ mezi týdny.
//   Každý generovaný týden vytvoří nové záznamy. Starší zůstanou.
//   Tím je zajištěna historická přehlednost.
// =====================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Absolutní cesta ke složce se soubory MenuDay
const menuDayFolderPath = path.join(__dirname, "storage", "menuDayList");

// -----------------------------------------------------
// GET - načte jeden MenuDay podle id
// -----------------------------------------------------
function get(menuDayId) {
  try {
    const filePath = path.join(menuDayFolderPath, `${menuDayId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    // ENOENT = soubor neexistuje = MenuDay s tímto id není v databázi
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadMenuDay", message: error.message };
  }
}

// -----------------------------------------------------
// CREATE - vytvoří nový MenuDay záznam
// -----------------------------------------------------
function create(menuDay) {
  try {
    // Vygenerujeme unikátní id (stejný princip jako u Dish)
    menuDay.id = crypto.randomBytes(16).toString("hex");

    const filePath = path.join(menuDayFolderPath, `${menuDay.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(menuDay), "utf8");
    return menuDay;
  } catch (error) {
    throw { code: "failedToCreateMenuDay", message: error.message };
  }
}

// -----------------------------------------------------
// UPDATE - aktualizuje existující MenuDay
// -----------------------------------------------------
// Používá se pro:
//   - záměnu jídla (UC02): předá se nové pole dishes
//   - schválení (UC03): předá se status:"PUBLISHED" a approvedAt timestamp
function update(menuDay) {
  try {
    // Načteme aktuální stav ze souboru
    const current = get(menuDay.id);

    // null = MenuDay s tímto id neexistuje
    if (!current) return null;

    // Sloučíme starý a nový objekt (viz vysvětlení v dish-dao.js)
    const updated = { ...current, ...menuDay };

    const filePath = path.join(menuDayFolderPath, `${menuDay.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updated), "utf8");
    return updated;
  } catch (error) {
    throw { code: "failedToUpdateMenuDay", message: error.message };
  }
}

// -----------------------------------------------------
// REMOVE - smaže MenuDay podle id
// -----------------------------------------------------
function remove(menuDayId) {
  try {
    const filePath = path.join(menuDayFolderPath, `${menuDayId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    // Pokud soubor neexistuje, smazání je "splněno" - neházemé chybu
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveMenuDay", message: error.message };
  }
}

// -----------------------------------------------------
// LIST - vrátí seznam MenuDay objektů s volitelným filtrem
// -----------------------------------------------------
// Parametry filtru (všechny volitelné):
//   filter.year       - číslo roku (2026)
//   filter.weekNumber - číslo ISO týdne (1..53)
//   filter.status     - "DRAFT" nebo "PUBLISHED"
//   filter.date       - konkrétní datum "YYYY-MM-DD"
function list(filter = {}) {
  try {
    // Načteme všechny soubory ze složky, vyfiltrujeme .json a parsujeme
    const files = fs.readdirSync(menuDayFolderPath);
    let menuDayList = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const fileData = fs.readFileSync(path.join(menuDayFolderPath, file), "utf8");
        return JSON.parse(fileData);
      });

    // Aplikujeme filtry jeden po druhém.
    // Každý filter.xxx zúží seznam na záznamy splňující podmínku.
    if (filter.year !== undefined) {
      menuDayList = menuDayList.filter((m) => m.year === filter.year);
    }
    if (filter.weekNumber !== undefined) {
      menuDayList = menuDayList.filter((m) => m.weekNumber === filter.weekNumber);
    }
    if (filter.status) {
      menuDayList = menuDayList.filter((m) => m.status === filter.status);
    }
    if (filter.date) {
      menuDayList = menuDayList.filter((m) => m.date === filter.date);
    }

    // Seřadíme chronologicky (od nejstaršího po nejnovější).
    // Porovnáváme ISO datové řetězce - funguje lexikograficky
    // protože formát YYYY-MM-DD zajišťuje správné abecední pořadí.
    menuDayList.sort((a, b) => (a.date > b.date ? 1 : -1));

    return menuDayList;
  } catch (error) {
    throw { code: "failedToListMenuDays", message: error.message };
  }
}

// -----------------------------------------------------
// LISTBYDISHID - najde MenuDay záznamy používající dané jídlo
// -----------------------------------------------------
// Využívá se v deleteAbl pro kontrolu referenční integrity:
// před smazáním jídla ověříme, zda na něj neodkazuje žádný MenuDay.
function listByDishId(dishId) {
  // Načteme všechny MenuDay záznamy (bez filtru)
  const all = list();

  // Z každého MenuDay zkontrolujeme pole dishes, jestli obsahuje
  // vazbu s hledaným dishId. Metoda .some() vrátí true, jakmile
  // najde alespoň jednu shodu - nepokračuje zbytečně dál.
  return all.filter(
    (md) => md.dishes && md.dishes.some((d) => d.dishId === dishId)
  );
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  listByDishId,
};
