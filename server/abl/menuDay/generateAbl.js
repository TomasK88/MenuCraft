// =====================================================
// ABL: MenuDay - GENERATE (BUC-1: vygenerování týdenního menu)
// -----------------------------------------------------
// POST /menuDay/generate
// Body (JSON):
//   {
//     "weekStartDate": "2026-05-11",   // pondělí daného týdne (YYYY-MM-DD)
//     "soupCount": 1,                  // kolik polévek na den
//     "mainCourseCount": 3             // kolik hlavních jídel na den
//   }
//
// Co se stane:
//   1) Načteme aktivní jídla z dish-dao (zvlášť polévky a hlavní jídla).
//   2) Ověříme, že je jich dost (5 dní * count).
//   3) Pro každý den (pondělí..pátek) vybereme náhodně jídla
//      bez opakování v rámci týdne.
//   4) Pro každé vybrané jídlo stanovíme aktuální cenu (zatím
//      ukázkově - frontend si ji bude moci přepsat). Cena je uložená
//      ve VAZBĚ MenuDay.dishes[].price (komentář učitele).
//   5) Uložíme 5 nových MenuDay objektů (status=DRAFT).
//
// HISTORIE: Existující MenuDay z předchozích týdnů NEMAŽEME.
// Tím je dodržen komentář učitele k UC03 - data zůstávají v historii.
// =====================================================

const Ajv = require("ajv");
const ajvFormats = require("ajv-formats");
const ajv = new Ajv();
ajvFormats(ajv);

const dishDao = require("../../dao/dish-dao.js");
const menuDayDao = require("../../dao/menuDay-dao.js");
const { dayOfWeek, isoWeekAndYear, mondayOfWeek, addDays } = require("./dateHelper");

const schema = {
  type: "object",
  properties: {
    weekStartDate: { type: "string", format: "date" }, // YYYY-MM-DD
    soupCount: { type: "integer", minimum: 1, maximum: 10 },
    mainCourseCount: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["weekStartDate", "soupCount", "mainCourseCount"],
  additionalProperties: false,
};

// Pomocná funkce: zamíchá pole (Fisher-Yates) - kopii.
function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


async function GenerateAbl(req, res) {
  try {
    const dtoIn = req.body;

    // 1) Validace
    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // Zarovnáme datum na pondělí (pro jistotu, kdyby uživatel poslal středu)
    const monday = mondayOfWeek(dtoIn.weekStartDate);

    // 2) Načteme aktivní jídla
    const activeSoups = dishDao.list({ category: "SOUP", isActive: true });
    const activeMains = dishDao.list({ category: "MAIN_COURSE", isActive: true });

    // 3) Ověříme, že je jich dost (5 pracovních dní)
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

    // 4) Náhodně zamícháme a vybereme bez opakování v rámci týdne
    const shuffledSoups = shuffle(activeSoups).slice(0, requiredSoups);
    const shuffledMains = shuffle(activeMains).slice(0, requiredMains);

    // 5) Pro každý ze 5 pracovních dnů vyrobíme MenuDay
    const created = [];
    for (let i = 0; i < 5; i++) {
      const date = addDays(monday, i);
      const { year, weekNumber } = isoWeekAndYear(date);

      // Vybereme jídla pro tento den
      const soupsForDay = shuffledSoups.slice(
        i * dtoIn.soupCount,
        (i + 1) * dtoIn.soupCount
      );
      const mainsForDay = shuffledMains.slice(
        i * dtoIn.mainCourseCount,
        (i + 1) * dtoIn.mainCourseCount
      );

      // Sestavíme pole vazeb {dishId, price, position}
      // Cena se kopíruje z dish.price v momentě generování = historický snapshot.
      // Pozdější zdražení jídla neovlivní již vygenerované MenuDay záznamy.
      const dishes = [];
      let position = 0;
      for (const soup of soupsForDay) {
        dishes.push({
          dishId: soup.id,
          price: soup.price,
          position: position++,
        });
      }
      for (const main of mainsForDay) {
        dishes.push({
          dishId: main.id,
          price: main.price,
          position: position++,
        });
      }

      const menuDay = {
        date,
        dayOfWeek: dayOfWeek(date),
        year,
        weekNumber,
        status: "DRAFT",
        dishes,
        generatedAt: new Date().toISOString(),
        approvedAt: null,
      };

      created.push(menuDayDao.create(menuDay));
    }

    res.json({ itemList: created });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = GenerateAbl;
