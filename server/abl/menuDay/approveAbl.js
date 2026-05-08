// =====================================================
// ABL: MenuDay - APPROVE (BUC-3: schválení týdenního menu)
// -----------------------------------------------------
// POST /menuDay/approve
// Body (JSON):
//   { "year": 2026, "weekNumber": 20 }
//
// Schválí všech 5 MenuDay (PO-PÁ) v daném týdnu.
//   - jejich status se změní z DRAFT na PUBLISHED
//   - zapíše se approvedAt timestamp
// Operace je all-or-nothing: pokud některý den není DRAFT,
// vrátíme chybu a nic nezměníme.
//
// Reflexe komentáře učitele k UC03:
//   - NEPŘEPISUJEME starší PUBLISHED MenuDay z minulých týdnů.
//     Každý týden má vlastní množinu pěti záznamů → historie zůstává.
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

    const valid = ajv.validate(schema, dtoIn);
    if (!valid) {
      res.status(400).json({
        code: "dtoInIsNotValid",
        message: "dtoIn is not valid",
        validationError: ajv.errors,
      });
      return;
    }

    // 1) Najdeme všech 5 MenuDay v daném týdnu
    const weekDays = menuDayDao.list({
      year: dtoIn.year,
      weekNumber: dtoIn.weekNumber,
    });

    if (weekDays.length !== 5) {
      res.status(400).json({
        code: "weekIncomplete",
        message: `V týdnu ${dtoIn.year}-${dtoIn.weekNumber} bylo nalezeno ${weekDays.length} MenuDay (očekáváno 5).`,
      });
      return;
    }

    // 2) Všechny musí být DRAFT
    const notDrafts = weekDays.filter((d) => d.status !== "DRAFT");
    if (notDrafts.length) {
      res.status(400).json({
        code: "menuDayNotInDraft",
        message: "Některý z dnů již není ve stavu DRAFT - týden lze schválit jen jednou.",
        offendingIds: notDrafts.map((d) => d.id),
      });
      return;
    }

    // 3) Schválíme - all-or-nothing (DAO update probíhá postupně,
    //    ale díky kontrole výše je to v praxi bezpečné).
    const approvedAt = new Date().toISOString();
    const approved = weekDays.map((d) =>
      menuDayDao.update({ id: d.id, status: "PUBLISHED", approvedAt })
    );

    res.json({ itemList: approved });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = ApproveAbl;
