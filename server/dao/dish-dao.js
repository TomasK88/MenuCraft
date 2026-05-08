/* Ukládá každý Dish jako samostatný JSON soubor ve složccstorage/dishList. 

Atributy Dish:
id          - jedinečný identifikátor (string)
name        - název jídla
category    - "SOUP" nebo "MAIN_COURSE"
price       - aktuální ceníková cena (number, Kč)
description - popis (volitelný)
allergens   - pole čísel 1-14 (EU alergeny)
isActive    - boolean - jestli se má jídlo nabízet při generování
*/

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Cesta k adresáři, kde jsou jednotlivá jídla jako JSON soubory
const dishFolderPath = path.join(__dirname, "storage", "dishList");

// Načte jeden Dish podle id. Vrací null, když neexistuje.
function get(dishId) {
  try {
    const filePath = path.join(dishFolderPath, `${dishId}.json`);
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    if (error.code === "ENOENT") return null; // soubor neexistuje
    throw { code: "failedToReadDish", message: error.message };
  }
}

// Vytvoří nový Dish, vygeneruje mu id a uloží do souboru.
function create(dish) {
  try {
    // Kontrola unikátnosti názvu (volitelná, ale bývá užitečná).
    const dishList = list();
    if (dishList.some((item) => item.name === dish.name)) {
      throw {
        code: "dishNameAlreadyExists",
        message: `Dish s názvem "${dish.name}" již existuje`,
      };
    }
    dish.id = crypto.randomBytes(16).toString("hex");
    const filePath = path.join(dishFolderPath, `${dish.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dish), "utf8");
    return dish;
  } catch (error) {
    // Pokud už máme strukturovanou chybu (s code), předáme ji dál.
    if (error.code) throw error;
    throw { code: "failedToCreateDish", message: error.message };
  }
}

// Aktualizuje Dish (sloučí staré a nové hodnoty). Vrací null, když nenajde.
function update(dish) {
  try {
    const current = get(dish.id);
    if (!current) return null;

    // Pokud se mění název, ověříme, že nekoliduje s jiným.
    if (dish.name && dish.name !== current.name) {
      const dishList = list();
      if (dishList.some((item) => item.name === dish.name && item.id !== dish.id)) {
        throw {
          code: "dishNameAlreadyExists",
          message: `Dish s názvem "${dish.name}" již existuje`,
        };
      }
    }

    const updated = { ...current, ...dish };
    const filePath = path.join(dishFolderPath, `${dish.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updated), "utf8");
    return updated;
  } catch (error) {
    if (error.code) throw error;
    throw { code: "failedToUpdateDish", message: error.message };
  }
}

// Odstraní Dish podle id. Pokud soubor neexistuje, vrátí prázdný objekt.
function remove(dishId) {
  try {
    const filePath = path.join(dishFolderPath, `${dishId}.json`);
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveDish", message: error.message };
  }
}

// Vrátí seznam všech jídel. Volitelně lze filtrovat podle category nebo isActive.
function list(filter = {}) {
  try {
    const files = fs.readdirSync(dishFolderPath);
    let dishList = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const fileData = fs.readFileSync(path.join(dishFolderPath, file), "utf8");
        return JSON.parse(fileData);
      });

    if (filter.category) {
      dishList = dishList.filter((d) => d.category === filter.category);
    }
    if (filter.isActive !== undefined) {
      dishList = dishList.filter((d) => d.isActive === filter.isActive);
    }
    // Seřadíme abecedně podle názvu - ať je výpis stabilní.
    dishList.sort((a, b) => a.name.localeCompare(b.name));
    return dishList;
  } catch (error) {
    throw { code: "failedToListDishes", message: error.message };
  }
}

module.exports = {
  get,
  create,
  update,
  remove,
  list,
};
