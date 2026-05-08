// =====================================================
// components/DishFormDialog.jsx - formulář pro přidání/úpravu jídla
// -----------------------------------------------------
// Jeden dialog slouží pro dvě akce:
//   - Přidání nového jídla (dish prop = null)
//   - Úpravu existujícího jídla (dish prop = objekt s daty)
//
// Logika:
//   1) useEffect naplní formulář daty při otevření dialogu
//   2) Validace proběhne před odesláním (ne průběžně)
//   3) Po úspěšném uložení zavolá onSaved(saved) s výsledkem
// =====================================================

import { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";

import { CATEGORIES, ALLERGENS } from "../constants";
import { createDish, updateDish } from "../api";

// Výchozí stav prázdného formuláře pro přidání nového jídla
const EMPTY = {
  name: "",
  category: "MAIN_COURSE",
  price: "",
  description: "",
  allergens: [],   // pole čísel - ID alergenů (1-14)
  isActive: true,
};

function DishFormDialog({ open, dish, onClose, onSaved }) {
  // form = lokální stav formuláře (vše co uživatel vyplnil)
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // isEdit = true pokud upravujeme existující jídlo, false pokud přidáváme nové
  const isEdit = Boolean(dish);

  // useEffect se spustí vždy když se změní open nebo dish.
  // Důvod: chceme formulář vždy "resetovat" na aktuální data při otevření.
  useEffect(() => {
    if (open) {
      // Pokud upravujeme, předplníme formulář daty jídla.
      // price převedeme na string, protože TextField pracuje s textem.
      setForm(dish ? { ...dish, price: String(dish.price) } : EMPTY);
      setError(""); // vymažeme staré chybové hlášky
    }
  }, [open, dish]);

  // Pomocná funkce pro aktualizaci jednoho pole formuláře.
  // Funkcionální update (f => ...) zaručí, že vždy pracujeme s aktuálním stavem.
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Přepne alergen: pokud je v poli, odstraní ho. Jinak přidá.
  // .sort() zajistí seřazení čísel (1, 3, 7 místo 3, 1, 7)
  function toggleAllergen(id) {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(id)
        ? f.allergens.filter((a) => a !== id)
        : [...f.allergens, id].sort((a, b) => a - b),
    }));
  }

  async function handleSave() {
    setError("");
    // parseFloat() převede string "149" na číslo 149
    const price = parseFloat(form.price);

    // Validace před odesláním na backend
    if (!form.name.trim()) return setError("Název je povinný.");
    if (isNaN(price) || price < 0) return setError("Cena musí být kladné číslo.");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price,
        description: form.description.trim(),
        allergens: form.allergens,
        isActive: form.isActive,
      };

      let saved;
      if (isEdit) {
        // Při úpravě pošleme id + změněné atributy
        saved = await updateDish({ id: dish.id, ...payload });
      } else {
        saved = await createDish(payload);
      }

      // Předáme uložené jídlo rodiči (aby aktualizoval seznam)
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      // finally se spustí vždy - ať úspěch nebo chyba
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Upravit jídlo" : "Přidat jídlo"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {/* Alert se zobrazí jen při chybě (podmíněné renderování) */}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Název"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            fullWidth
            required
          />

          {/* Grid rozdělí řádek na sekce: 8/12 pro kategorii, 4/12 pro cenu */}
          <Grid container spacing={2}>
            <Grid size={8}>
              {/* select={true} přemění TextField na dropdown (select element) */}
              <TextField
                select
                label="Kategorie"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                fullWidth
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={4}>
              <TextField
                label="Cena (Kč)"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Popis"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          {/* Sekce alergenů - checkboxy ve dvou sloupcích */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 0.5, fontSize: 14 }}>
              Alergeny
            </FormLabel>
            {/* row = checkboxy vedle sebe (ne pod sebou) */}
            <FormGroup row>
              {ALLERGENS.map((a) => (
                <FormControlLabel
                  key={a.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.allergens.includes(a.id)}
                      onChange={() => toggleAllergen(a.id)}
                    />
                  }
                  label={a.label}
                  // width 50% = dva sloupce vedle sebe
                  sx={{ width: "50%", mr: 0, mb: 0 }}
                />
              ))}
            </FormGroup>
          </FormControl>

          {/* Switch (přepínač) pro aktivní/neaktivní stav jídla */}
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                color="primary"
              />
            }
            label="Aktivní (zařazeno do generátoru)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Zrušit
        </Button>
        {/* disabled={saving} zamezí dvojímu odeslání */}
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Ukládám…" : "Uložit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DishFormDialog;
