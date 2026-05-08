// =====================================================
// DAO (Data Access Object) pro entitu Dish
// -----------------------------------------------------
// DAO je vrstva, která se stará výhradně o ukládání a čtení dat.
// Zbytek aplikace (ABL, controller) neví, kde a jak jsou data uložena
// - stačí mu zavolat funkce get(), create() atd.
//
// V tomto projektu ukládáme každý Dish jako samostatný JSON soubor
// ve složce storage/dishList. Jeden soubor = jedno jídlo.
// Název souboru je vždy <id>.json, např. "a3f1...json".
//
// Atributy Dish:
//   id          - jedinečný identifikátor (string)
//   name        - název jídla
//   category    - "SOUP" nebo "MAIN_COURSE"
//   price       - aktuální ceníková cena (number, Kč)
//   description - popis (volitelný)
//   allergens   - pole čísel 1-14 (EU alergeny)
//   isActive    - boolean - jestli se má jídlo nabízet při generování
//
// POZN. k ceně: dish.price = aktuální cena v ceníku. Při generování
// MenuDay se cena zkopíruje do vazby MenuDay.dishes[].price jako
// historický snapshot — zdražení jídla nezmění ceny v již
// vygenerovaných týdnech.
// =====================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Sestavíme absolutní cestu ke složce se soubory jídel.
// __dirname = adresář tohoto souboru (dao/)
// path.join spojí části cesty platformově správně (/ na Mac/Linux, \ na Windows)
const dishFolderPath = path.join(__dirname, "storage", "dishList");

// -----------------------------------------------------
// GET - načte jedno jídlo podle jeho id
// -----------------------------------------------------
function get(dishId) {
  try {
    // Sestavíme cestu k souboru, např. storage/dishList/a3f1....json
    const filePath = path.join(dishFolderPath, `${dishId}.json`);

    // Přečteme soubor jako text (kódování utf8)
    const fileData = fs.readFileSync(filePath, "utf8");

    // Převedeme JSON text zpět na JavaScript objekt a vrátíme ho
    return JSON.parse(fileData);
  } catch (error) {
    // Pokud soubor neexistuje (ENOENT = "Error NO ENTry"), vrátíme null.
    // To znamená: jídlo s tímto id v databázi není.
    if (error.code === "ENOENT") return null;

    // Jiná chyba (např. poškozený soubor) - vyhodíme strukturovanou chybu
    throw { code: "failedToReadDish", message: error.message };
  }
}

// -----------------------------------------------------
// CREATE - vytvoří nové jídlo a uloží ho do souboru
// -----------------------------------------------------
function create(dish) {
  try {
    // Načteme všechna existující jídla a zkontrolujeme, zda stejný název
    // již neexistuje. Dvě jídla se stejným názvem by způsobila zmatek.
    const dishList = list();
    if (dishList.some((item) => item.name === dish.name)) {
      throw {
        code: "dishNameAlreadyExists",
        message: `Dish s názvem "${dish.name}" již existuje`,
      };
    }

    // Vygenerujeme náhodné unikátní id jako 32 hexadecimálních znaků.
    // crypto.randomBytes(16) = 16 náhodných bajtů
    // .toString("hex") = převod na hex řetězec, např. "a3f12b8c..."
    // Tím zaručíme, že každé jídlo má unikátní id bez centrálního čítače.
    dish.id = crypto.randomBytes(16).toString("hex");

    // Sestavíme cestu k souboru, kde jídlo uložíme.
    // Název souboru = id jídla + přípona .json
    const filePath = path.join(dishFolderPath, `${dish.id}.json`);

    // Převedeme JavaScript objekt na JSON text a zapíšeme ho do souboru.
    // JSON.stringify(dish) = {"id":"a3f1...","name":"Svíčková",...}
    fs.writeFileSync(filePath, JSON.stringify(dish), "utf8");

    // Vrátíme vytvořený objekt (včetně vygenerovaného id) volajícímu kódu
    return dish;
  } catch (error) {
    // Pokud error.code existuje, jde o naši strukturovanou chybu (viz výše).
    // Předáme ji dál beze změny - ABL ji zobrazí klientovi.
    if (error.code) throw error;

    // Jinak jde o neočekávanou systémovou chybu (disk plný apod.)
    throw { code: "failedToCreateDish", message: error.message };
  }
}

// -----------------------------------------------------
// UPDATE - aktualizuje existující jídlo
// -----------------------------------------------------
function update(dish) {
  try {
    // Nejdříve načteme aktuální stav jídla ze souboru
    const current = get(dish.id);

    // Pokud jídlo s tímto id neexistuje, vrátíme null
    // (ABL to pak zobrazí jako 404 Not Found)
    if (!current) return null;

    // Pokud se mění název, ověříme, že nový název nepoužívá jiné jídlo
    if (dish.name && dish.name !== current.name) {
      const dishList = list();
      if (dishList.some((item) => item.name === dish.name && item.id !== dish.id)) {
        throw {
          code: "dishNameAlreadyExists",
          message: `Dish s názvem "${dish.name}" již existuje`,
        };
      }
    }

    // Spread operátor (...) sloučí starý a nový objekt.
    // Klíče z dish přepíší shodné klíče z current, ostatní zůstanou.
    // Příklad: current = {id, name, price:149}, dish = {id, price:155}
    //          updated = {id, name, price:155}  ← jen price se změnila
    const updated = { ...current, ...dish };

    // Přepíšeme soubor aktualizovaným objektem
    const filePath = path.join(dishFolderPath, `${dish.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updated), "utf8");

    return updated;
  } catch (error) {
    if (error.code) throw error;
    throw { code: "failedToUpdateDish", message: error.message };
  }
}

// -----------------------------------------------------
// REMOVE - smaže jídlo (odstraní soubor)
// -----------------------------------------------------
function remove(dishId) {
  try {
    const filePath = path.join(dishFolderPath, `${dishId}.json`);

    // fs.unlinkSync odstraní soubor z disku (obdoba rm v terminálu)
    fs.unlinkSync(filePath);
    return {};
  } catch (error) {
    // Pokud soubor neexistuje, mazání je splněno - vrátíme prázdný objekt
    if (error.code === "ENOENT") return {};
    throw { code: "failedToRemoveDish", message: error.message };
  }
}

// -----------------------------------------------------
// LIST - vrátí seznam všech jídel, volitelně filtrovaný
// -----------------------------------------------------
function list(filter = {}) {
  try {
    // Přečteme seznam všech souborů ve složce dishList
    const files = fs.readdirSync(dishFolderPath);

    // Z názvů souborů načteme jen ty s příponou .json a každý
    // převedeme z JSON textu na JavaScript objekt
    let dishList = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const fileData = fs.readFileSync(path.join(dishFolderPath, file), "utf8");
        return JSON.parse(fileData);
      });

    // Volitelné filtrování podle kategorie (SOUP / MAIN_COURSE)
    if (filter.category) {
      dishList = dishList.filter((d) => d.category === filter.category);
    }

    // Volitelné filtrování podle aktivního stavu
    if (filter.isActive !== undefined) {
      dishList = dishList.filter((d) => d.isActive === filter.isActive);
    }

    // Seřadíme abecedně podle názvu - pořadí souborů na disku je
    // nepředvídatelné a klient by dostával pokaždé jiné pořadí
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
