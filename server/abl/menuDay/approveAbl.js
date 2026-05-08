// =====================================================
// abl/menuDay/approveAbl.js - schválení týdenního menu (UC03)
// -----------------------------------------------------
// POST /menuDay/approve
// Tělo požadavku (JSON):
//   { "year": 2026, "weekNumber": 20 }
//
// Schválí najednou všech 5 MenuDay (PO-PÁ) daného týdne:
//   - status se změní z DRAFT na PUBLISHED
//   - uloží se approvedAt timestamp (kdy bylo schváleno)
//
// Operace je "all-or-nothing":
//   Pokud JAKÝKOLIV den v týdnu není DRAFT (např. jeden je
//   již PUBLISHED), celá operace selže a nic se nezmění.
//   Tím se zabrání nekonzistentnímu stavu (část DRAFT, část PUBLISHED).
// =====================================================

const Ajv = require("ajv");
const ajv = new Ajv();

const menuDayDao = require("../../dao/menuDay-dao.js");

const schema = {
  type: "object",
  properties: {
    year: { type: "integer", minimum: 2000, maximum: 3000 },
    weekNumber: { type: "integer", minimum: 1, maximum: 53 },
  },
  required: ["year", "weekNumber"],
  additionalProperties: false,
};

async function ApproveAbl(req, res) {
  try {
    const dtoIn = req.body;

    // Validace - year a weekNumber musí být platná čísla
    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // 1) Najdeme všech 5 MenuDay objektů pro daný týden.
    //    Filtrujeme kombinací year + weekNumber - tak přesně identifikujeme
    //    jeden konkrétní týden v historii (např. týden 20 roku 2026).
    const weekDays = menuDayDao.list({
      year: dtoIn.year,
      weekNumber: dtoIn.weekNumber,
    });

    // Kontrola, že týden je kompletní - musíme mít přesně 5 dní (PO-PÁ).
    // Méně = menu nebylo vygenerováno nebo bylo částečně smazáno.
    if (weekDays.length !== 5) {
      res.status(400).json({
        code: "weekIncomplete",
        message: `V týdnu ${dtoIn.year}-${dtoIn.weekNumber} bylo nalezeno ${weekDays.length} MenuDay (očekáváno 5).`,
      });
      return;
    }

    // 2) Ověříme, že VŠECHNY dny jsou ve stavu DRAFT.
    //    .filter() vrátí pole dní, které nejsou DRAFT.
    //    Pokud je prázdné (length === 0), vše je v pořádku.
    const notDrafts = weekDays.filter((d) => d.status !== "DRAFT");
    if (notDrafts.length) {
      res.status(400).json({
        code: "menuDayNotInDraft",
        message: "Některý z dnů již není ve stavu DRAFT - týden lze schválit jen jednou.",
        // Vrátíme id problematických dní, aby uživatel věděl, které to jsou
        offendingIds: notDrafts.map((d) => d.id),
      });
      return;
    }

    // 3) Schválíme všech 5 dní najednou.
    //    Jeden timestamp pro všechny - celý týden je schválen ve stejný okamžik.
    const approvedAt = new Date().toISOString();

    // .map() projde každý den a zavolá DAO update.
    // Výsledkem je pole 5 aktualizovaných MenuDay objektů.
    const approved = weekDays.map((d) =>
      menuDayDao.update({ id: d.id, status: "PUBLISHED", approvedAt })
    );

    // Vrátíme všech 5 schválených MenuDay objektů
    res.json({ itemList: approved });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ApproveAbl;
