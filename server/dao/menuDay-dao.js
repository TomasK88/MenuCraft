// =====================================================
// DAO (Data Access Object) pro entitu MenuDay
// -----------------------------------------------------
// Ukládá každý MenuDay jako samostatný JSON soubor ve složce
// storage/menuDayList.
//
// Atributy MenuDay (po reflexi komentářů učitele):
//   id           - jedinečný identifikátor
//   date         - konkrétní datum, např. "2026-05-11" (ISO YYYY-MM-DD)
//                  -> z data se odvodí dayOfWeek, weekNumber a year
//                  -> tím je vyřešena učitelova připomínka, jak
//                     poznat, do jakého týdne den patří
//   dayOfWeek    - "MONDAY".."FRIDAY" (odvozeno z date)
//   weekNumber   - ISO číslo týdne 1..53 (odvozeno z date)
//   year         - rok (odvozeno z date)
//   status       - "DRAFT" nebo "PUBLISHED"
//   dishes       - vazba na jídla: pole { dishId, price, position }
//                  -> price je SOUČÁSTÍ VAZBY (komentář učitele)
//   generatedAt  - ISO timestamp vytvoření MenuDay
//   approvedAt   - ISO timestamp schválení (null dokud DRAFT)
//
// Historie: Záznamy se NEPŘEPISUJÍ. Při generování dalšího týdne
// se vytvoří nové MenuDay objekty (komentář učitele k UC03).
// =====================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const menuDayFolderPath = path.join(__dirname, "storage", "menuDayList");

// Načte jeden MenuDay podle id.
function get(menuDayId) {
  try {
    const filePath = path.join(menuDayFolderPath, `${menuDayId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw { code: "failedToReadMenuDay", message: error.message };
  }
}

// Vytvoří nový MenuDay (vygeneruje id, uloží).
function create(menuDay) {
  try {
    menuDay.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(menuDayFolderPath, `${menuDay.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(menuDay), "utf8");
    return menuDay;
  } catch (error) {
    throw { code: "failedToCreateMenuDay", message: error.message };
  }
}

// Aktualizuje MenuDay (sloučí staré a nové hodnoty).
function update(menuDay) {
  try {
    const current = get(menuDay.id);
    if (!current) return null;
    const updated = { ...current, ...menuDay };
    const filePath = path.join(menuDayFolderPath, `${menuDay.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updated), "utf8");
    return updated;
  } catch (error) {
    throw { code: "failedToUpdateMenuDay", message: error.message };
  }
}

// Odstraní MenuDay podle id.
function remove(menuDayId) {
  try {
    const filePath = path.join(menuDayFolderPath, `${menuDayId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveMenuDay", message: error.message };
  }
}

// Vrátí seznam MenuDay objektů. Volitelně lze filtrovat:
//   - filter.year       (číslo)
//   - filter.weekNumber (číslo 1..53)
//   - filter.status     ("DRAFT" / "PUBLISHED")
//   - filter.date       (string YYYY-MM-DD)
function list(filter = {}) {
  try {
    const files = fs.readdirSync(menuDayFolderPath);
    let menuDayList = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const fileData = fs.readFileSync(path.join(menuDayFolderPath, file), "utf8");
        return JSON.parse(fileData);
      });

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
    // Seřadíme od nejstaršího po nejnovější datum.
    menuDayList.sort((a, b) => (a.date > b.date ? 1 : -1));
    return menuDayList;
  } catch (error) {
    throw { code: "failedToListMenuDays", message: error.message };
  }
}

// Vrátí MenuDay objekty, které referencují daný dishId
// (využijeme při mazání jídla - viz E1 v BUC-4).
function listByDishId(dishId) {
  const all = list();
  return all.filter((md) => md.dishes && md.dishes.some((d) => d.dishId === dishId));
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
  listByDishId,
};
