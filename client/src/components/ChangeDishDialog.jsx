// =====================================================
// components/ChangeDishDialog.jsx - záměna jídla v menu
// -----------------------------------------------------
// UC02: Umožní zaměnit konkrétní jídlo v DRAFT menu za jiné.
//
// Důležitá pravidla:
//   - Nabídne jen aktivní jídla stejné kategorie (nelze zaměnit polévku za hlavní)
//   - Vyloučí jídla, která jsou již použita v jiném dni téhož týdne
//     (každé jídlo se může v týdnu opakovat max. 1×)
//   - Po záměně uloží celý aktualizovaný seznam dishes přes updateMenuDay
//
// Props:
//   open      - boolean
//   menuDay   - celý objekt dne, jehož jídlo měníme
//   dishSlot  - { dishId, price, position, category } - konkrétní jídlo ke změně
//   weekDays  - všechny dny tohoto týdne (pro detekci duplicit)
//   allDishes - celý katalog jídel (pro filtrování možností)
//   onClose   - callback zavření
//   onSaved   - callback(updatedMenuDay) po úspěšném uložení
// =====================================================

import { useState, useEffect, useMemo } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import { CATEGORY_LABELS } from "../constants";
import { updateMenuDay } from "../api";

function ChangeDishDialog({ open, menuDay, dishSlot, weekDays, allDishes, onClose, onSaved }) {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset stavu při každém otevření dialogu
  useEffect(() => {
    if (open) {
      setSelected(null);
      setError("");
    }
  }, [open]);

  // useMemo = zapamatuje výsledek výpočtu. Přepočítá se jen když se změní závislosti.
  // Výhoda: nefiltrujeme celý katalog při každém překreslení (render), jen při změně dat.

  // Sada dishId, která jsou použita v ostatních dnech stejného týdne (ne v aktuálním dni)
  const usedIds = useMemo(() => {
    if (!dishSlot || !weekDays) return new Set();
    const set = new Set();
    for (const day of weekDays) {
      // Přeskočíme aktuální den - chceme jen ostatní dny
      if (day.id === menuDay?.id) continue;
      for (const d of day.dishes || []) {
        set.add(d.dishId);
      }
    }
    return set;
  }, [dishSlot, weekDays, menuDay]);

  // Filtrovaný seznam jídel, která lze nabídnout jako záměnu
  const options = useMemo(() => {
    if (!dishSlot || !allDishes) return [];
    return allDishes.filter(
      (d) =>
        d.isActive &&                        // jen aktivní jídla
        d.category === dishSlot.category &&  // stejná kategorie
        d.id !== dishSlot.dishId &&          // ne to samé jídlo
        !usedIds.has(d.id)                   // nepoužité v jiném dni téhož týdne
    );
  }, [dishSlot, allDishes, usedIds]);

  async function handleSave() {
    if (!selected) return setError("Vyberte jídlo.");
    setError("");
    setSaving(true);
    try {
      // Sestavíme nový seznam jídel - nahradíme jen ten na dané pozici.
      // .map() projde každé jídlo: pokud je to to, co měníme (podle position),
      // vrátí nový objekt s novým dishId a cenou. Ostatní vrátí beze změny.
      const newDishes = (menuDay.dishes || []).map((d) =>
        d.position === dishSlot.position
          ? { dishId: selected.id, price: selected.price, position: d.position }
          : d
      );

      const updated = await updateMenuDay({ id: menuDay.id, dishes: newDishes });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Změna jídla</DialogTitle>
      <DialogContent>
        {/* Zobrazíme kategorii - uživatel ví, co hledá */}
        {dishSlot && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Kategorie: <strong>{CATEGORY_LABELS[dishSlot.category]}</strong>
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Autocomplete = TextField s vyhledáváním v nabídce možností */}
        <Autocomplete
          options={options}
          getOptionLabel={(o) => `${o.name} (${o.price} Kč)`}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          renderInput={(params) => (
            <TextField {...params} label="Vyberte jídlo" fullWidth />
          )}
          noOptionsText="Žádná dostupná jídla"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Zrušit
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !selected}
        >
          {saving ? "Ukládám…" : "Uložit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChangeDishDialog;
