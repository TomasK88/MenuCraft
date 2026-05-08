// =====================================================
// pages/GeneratorPage.jsx - generátor týdenního menu
// -----------------------------------------------------
// Hlavní stránka aplikace. Umožňuje:
//   UC01: Vygenerovat týdenní menu (5 dní × N jídel)
//   UC02: Zaměnit jídlo v konkrétním dni
//   UC03: Schválit celý týden (DRAFT → PUBLISHED)
//
// Tok dat:
//   1) Uživatel vybere datum → vypočítáme ISO týden (rok + číslo)
//   2) Načteme existující menu pro daný týden z backendu
//   3) Uživatel klikne Generovat → backend vytvoří 5 MenuDay objektů
//   4) Uživatel může zaměnit jídlo (SwapHorizIcon) → UC02
//   5) Uživatel schválí týden (zelené tlačítko) → UC03
// =====================================================

import { useState, useEffect, useCallback } from "react";

// dayjs = lehká knihovna pro práci s daty (alternativa k moment.js)
import dayjs from "dayjs";
// isoWeek plugin přidá metody .isoWeek() a .isoWeekYear() pro ISO 8601 týdny
import isoWeek from "dayjs/plugin/isoWeek";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";

// DatePicker = komponenta pro výběr datumu z kalendáře
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';

import {
  getMenuDayList,
  getDishList,
  generateMenu,
  approveMenu,
  deleteMenuDay,
} from "../api";
import { DAY_LABELS, DAY_ORDER, CATEGORY_LABELS } from "../constants";
import ConfirmDialog from "../components/ConfirmDialog";
import ChangeDishDialog from "../components/ChangeDishDialog";

// Aktivujeme isoWeek plugin - musí se provést jednou před použitím metod
dayjs.extend(isoWeek);

function GeneratorPage() {
  // Vybraný datum v DatePickeru (dayjs objekt). Výchozí = dnešní datum.
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Počty jídel pro generování
  const [soupCount, setSoupCount] = useState(1);
  const [mainCourseCount, setMainCourseCount] = useState(5);

  // weekDays = pole MenuDay objektů pro vybraný týden (max. 5)
  const [weekDays, setWeekDays] = useState([]);

  // allDishes = celý katalog jídel (pro překlad dishId → název jídla)
  const [allDishes, setAllDishes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stavy potvrzovacích dialogů
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  // changeSlot = { menuDay, dishSlot } - otevřený dialog pro záměnu jídla
  const [changeSlot, setChangeSlot] = useState(null);

  // ---- Výpočet hodnot pro aktuálně vybraný týden ----

  // .isoWeekday(1) = nastaví den na pondělí daného týdne (ISO: 1=Po, 7=Ne)
  // .format("YYYY-MM-DD") = formát pro backend API
  const weekMonday = selectedDate
    ? selectedDate.isoWeekday(1).format("YYYY-MM-DD")
    : null;

  // ISO rok a číslo týdne - potřebné pro API volání (filter + approve)
  const weekYear = selectedDate ? selectedDate.isoWeekYear() : null;
  const weekNumber = selectedDate ? selectedDate.isoWeek() : null;

  // ---- Načtení menu při změně týdne ----

  // useCallback = stabilní reference funkce (nezmění se při re-renderu).
  // Díky tomu useEffect níže správně detekuje změnu závislostí.
  const loadWeek = useCallback(async () => {
    if (!weekYear || !weekNumber) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMenuDayList({ year: weekYear, weekNumber });
      setWeekDays(data.itemList || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [weekYear, weekNumber]);

  // Spustí se při změně weekYear nebo weekNumber (= při změně selected date)
  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  // Katalog jídel načteme jednou při prvním zobrazení stránky.
  // Slouží k překladu dishId → název jídla bez dalšího volání API.
  useEffect(() => {
    getDishList()
      .then((d) => setAllDishes(d.itemList || []))
      .catch(() => {}); // chybu ignorujeme - jen se nezobrazí názvy
  }, []);

  // Mapa { dishId → dish objekt } pro rychlý přístup O(1) místo .find() O(n)
  const dishById = Object.fromEntries(allDishes.map((d) => [d.id, d]));

  function getDishName(dishId) {
    return dishById[dishId]?.name ?? "Neznámé jídlo";
  }

  // Seřadíme dny Po → Pá pomocí pozice v DAY_ORDER poli
  const sortedDays = [...weekDays].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  // Podmínky pro zobrazení akcí
  const allDraft = weekDays.length > 0 && weekDays.every((d) => d.status === "DRAFT");
  const allPublished = weekDays.length > 0 && weekDays.every((d) => d.status === "PUBLISHED");

  // ---- Handlery pro akce ----

  async function handleGenerate() {
    setError("");
    setConfirmGenerate(false);

    // Pokud existuje menu, smažeme všechny dny před přegenerováním.
    // for...of = synchronní iterace (await v cyklu funguje správně)
    if (weekDays.length > 0) {
      for (const day of weekDays) {
        await deleteMenuDay(day.id);
      }
    }

    setLoading(true);
    try {
      const result = await generateMenu({
        weekStartDate: weekMonday,
        soupCount,
        mainCourseCount,
      });
      setWeekDays(result.itemList || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setError("");
    setConfirmApprove(false);
    setLoading(true);
    try {
      const result = await approveMenu({ year: weekYear, weekNumber });
      setWeekDays(result.itemList || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Otevře dialog pro záměnu jídla. Předáme celý den i konkrétní jídlo + kategorii.
  function handleChangeDish(menuDay, dishRef, category) {
    setChangeSlot({ menuDay, dishSlot: { ...dishRef, category } });
  }

  // Zavolá se po úspěšné záměně - aktualizujeme konkrétní den v seznamu
  function handleChangeSaved(updatedMenuDay) {
    setWeekDays((prev) =>
      prev.map((d) => (d.id === updatedMenuDay.id ? updatedMenuDay : d))
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto", textAlign: "center" }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Generátor poledního menu
      </Typography>

      {/* ---- Panel nastavení generování ---- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Formulář je rozložen vertikálně - každá sekce pod sebou */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Výběr týdne */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Vyber datum
            </Typography>
            {/* DatePicker - uživatel vybere libovolné datum, my z něj vypočítáme pondělí */}
            <DatePicker
              value={selectedDate}
              onChange={(v) => setSelectedDate(v)}
              // format pro zobrazení v poli (D.M.YYYY = 11.5.2026)
              format="D.M.YYYY"
              slotProps={{
                textField: { size: "small", sx: { maxWidth: 200 } },
              }}
            />
            {/* Informativní text pod date pickerem */}
            {selectedDate && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Týden {weekNumber}/{weekYear}:{" "}
                {selectedDate.isoWeekday(1).format("D.M.YYYY")} –{" "}
                {selectedDate.isoWeekday(5).format("D.M.YYYY")}
              </Typography>
            )}
          </Box>

          {/* Počty jídel */}
          <Box alignItems="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
              Zadejete počet polévek a hlavních jídel pro generování
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexDirection: "column", alignItems: "center" }}>
              <TextField
                label="Polévky"
                type="number"
                size="small"
                value={soupCount}
                onChange={(e) => setSoupCount(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: 10 }}
                sx={{ width: 140 }}
              />
              <TextField
                label="Hlavní jídla"
                type="number"
                size="small"
                value={mainCourseCount}
                onChange={(e) => setMainCourseCount(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: 10 }}
                sx={{ width: 140 }}
              />
            </Box>
          </Box>

          {/* Akční tlačítka */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              // Pokud existuje menu, zobrazíme potvrzovací dialog. Jinak generujeme přímo.
              onClick={() =>
                weekDays.length > 0 ? setConfirmGenerate(true) : handleGenerate()
              }
              disabled={loading}
            >
              {weekDays.length > 0 ? "Přegenerovat menu" : "Generovat menu"}
            </Button>

            
           
          </Box>
        </Box>
      </Paper>

      {/* ---- Chybová zpráva ---- */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ---- Sekce pro zobrazení menu ---- */}
 <Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 2,
    position: "relative",
  }}
>
  {/* Levá část */}
  <Box>
    {allDraft && (
      <Button
        variant="outlined"
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={() => setConfirmApprove(true)}
        disabled={loading}
      >
        Schválit týden
      </Button>
    )}
  </Box>

  {/* Nadpis přesně uprostřed */}
  <Typography
    variant="h4"
    sx={{
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
    }}
  >
    Polední menu
  </Typography>

  {/* Pravá část */}
  <Box>
    {weekDays.length > 0 && (
      <Chip
        label={allPublished ? "Schváleno" : "Koncept"}
        color={allPublished ? "success" : "default"}
        size="small"
      />
    )}
  </Box>
</Box>

      {/* Spinner při načítání */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Prázdný stav - pokud pro daný týden není menu */}
      {!loading && weekDays.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            py: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
          }}
        >
          <Typography color="text.secondary">
            Pro tento týden zatím neexistuje žádné menu. Klikněte na „Generovat menu".
          </Typography>
        </Paper>
      )}

      {/* ---- Mřížka 5 karet (Po – Pá) ---- */}
      {!loading && sortedDays.length > 0 && (
        <Grid container spacing={2}>
          {sortedDays.map((day) => {
            // Datum ve formátu DD.MM.YYYY pro zobrazení
            const dayDate = dayjs(day.date).format("D.M.YYYY");

            // Rozdělíme jídla dne na polévky a hlavní jídla
            // Kategorie zjistíme z katalogu (dishById) - MenuDay ukládá jen dishId
            const soups = (day.dishes || []).filter(
              (d) => dishById[d.dishId]?.category === "SOUP"
            );
            const mains = (day.dishes || []).filter(
              (d) => dishById[d.dishId]?.category === "MAIN_COURSE"
            );

            return (
              // size={{ xs: 12 }} = na mobilu plná šířka, lg: 2.4 = 5 sloupců na velkém monitoru
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={day.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    // Zelené ohraničení pro schválené dny
                    borderColor: day.status === "PUBLISHED" ? "success.main" : "divider",
                    borderWidth: day.status === "PUBLISHED" ? 2 : 1,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                    {/* Záhlaví karty: název dne + datum + stav */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {DAY_LABELS[day.dayOfWeek]}
                      </Typography>
                      <Chip
                        label={day.status === "PUBLISHED" ? "✓" : "Návrh"}
                        size="small"
                        color={day.status === "PUBLISHED" ? "success" : "default"}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {dayDate}
                    </Typography>

                    <Divider sx={{ mb: 1 }} />

                    {/* Polévky */}
                    {soups.map((d) => (
                      <DishRow
                        key={d.dishId}
                        name={getDishName(d.dishId)}
                        price={d.price}
                        category="SOUP"
                        canSwap={day.status === "DRAFT"}
                        onSwap={() => handleChangeDish(day, d, "SOUP")}
                      />
                    ))}

                    {/* Hlavní jídla */}
                    {mains.map((d) => (
                      <DishRow
                        key={d.dishId}
                        name={getDishName(d.dishId)}
                        price={d.price}
                        category="MAIN_COURSE"
                        canSwap={day.status === "DRAFT"}
                        onSwap={() => handleChangeDish(day, d, "MAIN_COURSE")}
                      />
                    ))}
                  </CardContent>

                  {/* Akce karty - smazání dne (jen u DRAFT) */}
                  {day.status === "DRAFT" && (
                    <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                      <Tooltip title="Smazat tento den">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            await deleteMenuDay(day.id);
                            setWeekDays((prev) => prev.filter((d) => d.id !== day.id));
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Informační Alert pro schválený týden */}
      {allPublished && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Tento týden je schválený. Menu nelze dále upravovat.
        </Alert>
      )}

      {/* ---- Dialogy ---- */}

      {/* Potvrzení přegenerování existujícího menu */}
      <ConfirmDialog
        open={confirmGenerate}
        title="Přegenerovat menu?"
        message="Pro tento týden již existuje menu. Přegenerováním se všechny dny smažou a vytvoří nové. Pokračovat?"
        confirmLabel="Přegenerovat"
        confirmColor="warning"
        onConfirm={handleGenerate}
        onCancel={() => setConfirmGenerate(false)}
      />

      {/* Potvrzení schválení týdne */}
      <ConfirmDialog
        open={confirmApprove}
        title="Schválit celý týden?"
        message={`Schválíte všech ${weekDays.length} dní týdne ${weekNumber}/${weekYear}. Schválené menu nelze dále upravovat.`}
        confirmLabel="Schválit"
        confirmColor="success"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      {/* Dialog pro záměnu jídla (UC02) */}
      <ChangeDishDialog
        open={Boolean(changeSlot)}
        menuDay={changeSlot?.menuDay}
        dishSlot={changeSlot?.dishSlot}
        weekDays={weekDays}
        allDishes={allDishes}
        onClose={() => setChangeSlot(null)}
        onSaved={handleChangeSaved}
      />
    </Box>
  );
}

// =====================================================
// Pomocná sub-komponenta: jeden řádek jídla v kartě dne
// =====================================================
// Zobrazí kategorii, název jídla, cenu a volitelně tlačítko záměny.
// Definujeme ji mimo GeneratorPage - vyhneme se jejímu zbytečnému
// znovu-vytváření při každém renderu rodiče.
function DishRow({ name, price, category, canSwap, onSwap }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Kategorie - šedý popisek nad názvem */}
        <Typography variant="caption" color="text.secondary" display="block">
          {CATEGORY_LABELS[category]}
        </Typography>
        {/* noWrap + title = ořízne dlouhý název a zobrazí ho v tooltip */}
        <Typography variant="body2" noWrap title={name} sx={{ fontWeight: 500 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {price} Kč
        </Typography>
      </Box>
      {/* Ikonka záměny se zobrazí jen u DRAFT menu */}
      {canSwap && (
        <Tooltip title="Zaměnit jídlo">
          <IconButton size="small" onClick={onSwap} sx={{ mt: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default GeneratorPage;
