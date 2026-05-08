// =====================================================
// abl/menuDay/generateAbl.js - vygenerování týdenního menu (UC01)
// -----------------------------------------------------
// POST /menuDay/generate
// Tělo požadavku (JSON):
//   {
//     "weekStartDate": "2026-05-11",  // pondělí týdne (YYYY-MM-DD)
//     "soupCount": 1,                  // počet polévek na den (1-10)
//     "mainCourseCount": 3             // počet hlavních jídel na den (1-10)
//   }
//
// Co operace udělá:
//   1) Načte aktivní jídla z knihovny (zvlášť polévky a hlavní jídla)
//   2) Ověří, že jich je dost pro celý týden (5 dní × count)
//   3) Náhodně zamíchá a rozdělí jídla mezi dny BEZ OPAKOVÁNÍ
//   4) Pro každý den vytvoří MenuDay objekt se seznamem jídel
//      a cenou zkopírovanou z dish.price (historický snapshot)
//   5) Uloží 5 nových MenuDay objektů ve stavu DRAFT
//
// Vrátí: { itemList: [5x MenuDay objekt] }
// =====================================================

// AJV + ajv-formats pro validaci včetně formátu "date" (YYYY-MM-DD)
const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const ajv = new Ajv();
// ajvFormats rozšíří AJV o podporu formátů jako "date", "email" atd.
// Bez tohoto by { format: "date" } v schématu nemělo žádný účinek.
ajvFormats(ajv);

const dishDao = require("../../dao/dish-dao.js");
const menuDayDao = require("../../dao/menuDay-dao.js");

// Importujeme pomocné funkce pro práci s daty (viz dateHelper.js)
const { dayOfWeek, isoWeekAndYear, mondayOfWeek, addDays } = require("./dateHelper");

const schema = {
  type: "object",
  properties: {
    weekStartDate: { type: "string", format: "date" }, // musí být platné datum YYYY-MM-DD
    soupCount: { type: "integer", minimum: 1, maximum: 10 },
    mainCourseCount: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["weekStartDate", "soupCount", "mainCourseCount"],
  additionalProperties: false,
};

// Pomocná funkce: náhodné zamíchání pole (algoritmus Fisher-Yates).
// Nepracuje na původním poli - vytvoří kopii (arr.slice()) a zamíchá ji.
// Fisher-Yates: prochází pole odzadu a vyměňuje každý prvek
// s náhodným prvkem na pozici <= aktuální. Výsledek je rovnoměrně náhodný.
function shuffle(arr) {
  const copy = arr.slice(); // kopie - nechceme měnit původní pole
  for (let i = copy.length - 1; i > 0; i--) {
    // Náhodný index od 0 do i (včetně)
    const j = Math.floor(Math.random() * (i + 1));
    // Swap (výměna) prvků na pozicích i a j pomocí destructuringu
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function GenerateAbl(req, res) {
  try {
    const dtoIn = req.body;

    // 1) Validace vstupu
    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Zarovnáme datum na pondělí daného týdne.
    // Kdyby uživatel poslal středu, výsledkem je stejné pondělí toho týdne.
    // Tím zaručíme konzistentní chování bez ohledu na to, který den pošle.
    const monday = mondayOfWeek(dtoIn.weekStartDate);

    // 2) Načteme aktivní jídla z knihovny - zvlášť polévky a hlavní jídla,
    //    protože každá kategorie jde do jiného slotu v menu
    const activeSoups = dishDao.list({ category: "SOUP", isActive: true });
    const activeMains = dishDao.list({ category: "MAIN_COURSE", isActive: true });

    // 3) Ověříme, že máme dost jídel pro celý týden BEZ OPAKOVÁNÍ.
    //    Každé jídlo může být v týdnu použito max. 1x.
    //    Proto potřebujeme: soupCount * 5 různých polévek atd.
    const requiredSoups = dtoIn.soupCount * 5;
    const requiredMains = dtoIn.mainCourseCount * 5;

    if (activeSoups.length < requiredSoups || activeMains.length < requiredMains) {
      res.status(400).json({
        code: "notEnoughDishes",
        message:
          `Pro vygenerování je potřeba alespoň ${requiredSoups} polévek a ${requiredMains} hlavních jídel.` +
          ` K dispozici je ${activeSoups.length} polévek a ${activeMains.length} hlavních jídel.`,
      });
      return;
    }

    // 4) Zamícháme pole a vezmeme přesně tolik jídel, kolik potřebujeme.
    //    .slice(0, requiredSoups) vezme první N prvků ze zamíchaného pole.
    //    Tím máme náhodně vybraná jídla BEZ OPAKOVÁNÍ pro celý týden.
    const shuffledSoups = shuffle(activeSoups).slice(0, requiredSoups);
    const shuffledMains = shuffle(activeMains).slice(0, requiredMains);

    // 5) Pro každý ze 5 pracovních dnů (i = 0 až 4) vytvoříme MenuDay
    const created = [];
    for (let i = 0; i < 5; i++) {
      // Datum konkrétního dne: pondělí + i dní (0=pondělí, 4=pátek)
      const date = addDays(monday, i);

      // Z data odvodíme ISO číslo týdne a rok
      const { year, weekNumber } = isoWeekAndYear(date);

      // Vybereme jídla pro tento konkrétní den.
      // .slice(start, end) vezme podpole:
      //   Den 0 (pondělí): indexy 0 .. soupCount-1
      //   Den 1 (úterý):   indexy soupCount .. 2*soupCount-1
      //   atd.
      const soupsForDay = shuffledSoups.slice(
        i * dtoIn.soupCount,
        (i + 1) * dtoIn.soupCount
      );
      const mainsForDay = shuffledMains.slice(
        i * dtoIn.mainCourseCount,
        (i + 1) * dtoIn.mainCourseCount
      );

      // Sestavíme pole vazeb { dishId, price, position }
      // Klíčový princip ceny:
      //   Kopírujeme dish.price v MOMENTĚ GENEROVÁNÍ = historický snapshot.
      //   Pokud se cena jídla v budoucnu změní (dish/update), tato
      //   již vygenerovaná menu zůstanou se starou cenou. Nová menu
      //   dostanou aktuální cenu. Tím je zachována cenová historie.
      const dishes = [];
      let position = 0; // pořadí v menu (polévky první, pak hlavní)

      for (const soup of soupsForDay) {
        dishes.push({
          dishId: soup.id,    // reference na jídlo v knihovně
          price: soup.price,  // snapshot aktuální ceny
          position: position++, // position++ = použij hodnotu, pak přičti 1
        });
      }
      for (const main of mainsForDay) {
        dishes.push({
          dishId: main.id,
          price: main.price,
          position: position++,
        });
      }

      // Sestavíme celý MenuDay objekt
      const menuDay = {
        date,                          // "2026-05-11"
        dayOfWeek: dayOfWeek(date),    // "MONDAY"
        year,                          // 2026
        weekNumber,                    // 20
        status: "DRAFT",               // nové menu začíná vždy jako DRAFT
        dishes,                        // pole vazeb na jídla
        generatedAt: new Date().toISOString(), // aktuální timestamp
        approvedAt: null,              // zatím neschváleno
      };

      // Uložíme do souboru přes DAO a přidáme do výsledného pole
      created.push(menuDayDao.create(menuDay));
    }

    // Vrátíme všech 5 vytvořených MenuDay objektů
    res.json({ itemList: created });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = GenerateAbl;
