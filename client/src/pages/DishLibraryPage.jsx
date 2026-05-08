// =====================================================
// pages/DishLibraryPage.jsx - správa knihovny jídel
// -----------------------------------------------------
// Zobrazí tabulku všech jídel s možností:
//   - Přidat nové jídlo (tlačítko Přidat jídlo)
//   - Upravit existující (ikona tužky v řádku)
//   - Smazat jídlo (ikona koše v řádku, s potvrzením)
//
// MUI DataGrid je pokročilá tabulka s řazením, stránkováním
// a filtrováním "zadarmo" - jen definujeme sloupce a data.
// =====================================================

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { getDishList, deleteDish } from "../api";
import { CATEGORY_LABELS, ALLERGENS } from "../constants";
import DishFormDialog from "../components/DishFormDialog";
import ConfirmDialog from "../components/ConfirmDialog";

// Mapa id alergenu → popis. Vytvoříme jednou mimo komponentu (nevytváří se při každém renderu).
// Object.fromEntries() převede pole [[1, "1 – Lepek"], ...] na objekt { 1: "1 – Lepek", ... }
const ALLERGEN_MAP = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label]));

function DishLibraryPage() {
  // rows = pole jídel načtených z backendu
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // formOpen = zda je otevřený dialog pro přidání/úpravu
  // editDish = jídlo které upravujeme (null = přidáváme nové)
  const [formOpen, setFormOpen] = useState(false);
  const [editDish, setEditDish] = useState(null);

  // deleteTarget = jídlo které chceme smazat (null = žádné)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // useCallback zapamatuje funkci mezi rendery.
  // Bez useCallback by se funkce vytvářela při každém renderu a způsobovala
  // nekonečnou smyčku v useEffect (který ji má jako závislost).
  const loadDishes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDishList();
      setRows(data.itemList || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect s prázdným polem závislostí = spustí se jednou po prvním renderu.
  // loadDishes je v závislosti, ale díky useCallback se nemění (referenčně stabilní).
  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  function handleAdd() {
    setEditDish(null); // null = přidáváme nové
    setFormOpen(true);
  }

  function handleEdit(dish) {
    setEditDish(dish); // předáme data jídla do formuláře
    setFormOpen(true);
  }

  // Zavolá se po úspěšném uložení (vytvoření nebo úpravě) jídla.
  // Aktualizuje seznam bez nutnosti znovu volat API.
  function handleSaved(saved) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        // Úprava: nahradíme existující řádek aktualizovaným
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      // Přidání: připojíme nový řádek na konec
      return [...prev, saved];
    });
  }

  async function handleDeleteConfirm() {
    setDeleteError("");
    try {
      await deleteDish(deleteTarget.id);
      // Odfiltrujeme smazané jídlo z lokálního stavu (bez volání API)
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      // Backend vrátí chybu pokud je jídlo použito v nějakém MenuDay
      setDeleteError(e.message);
      setDeleteTarget(null);
    }
  }

  // Definice sloupců pro DataGrid. Každý objekt = jeden sloupec.
  // field = klíč z datového objektu, renderCell = vlastní renderování buňky.
  const columns = [
    {
      field: "name",
      headerName: "Jídlo",
      flex: 2,
      minWidth: 160,
    },
    {
      field: "category",
      headerName: "Typ",
      width: 130,
      // renderCell dostane { value, row } - value je hodnota pole, row je celý objekt
      renderCell: ({ value }) => CATEGORY_LABELS[value] ?? value,
    },
    {
      field: "price",
      headerName: "Cena (Kč)",
      width: 110,
      type: "number",
      align: "right",
      headerAlign: "right",
    },
    {
      field: "isActive",
      headerName: "Aktivní",
      width: 90,
      renderCell: ({ value }) =>
        value ? (
          <Chip label="Ano" color="success" size="small" variant="outlined" />
        ) : (
          <Chip label="Ne" size="small" variant="outlined" />
        ),
    },
    {
      field: "allergens",
      headerName: "Alergeny",
      width: 160,
      sortable: false, // číselné pole - neřadíme
      renderCell: ({ value }) =>
        !value || value.length === 0
          ? "–"
          : value
              .sort((a, b) => a - b)
              .map((id) => (
                // Tooltip zobrazí popis alergenu při najetí myší na číslo
                <Tooltip key={id} title={ALLERGEN_MAP[id] ?? id}>
                  <Chip label={id} size="small" sx={{ mr: 0.5 }} />
                </Tooltip>
              )),
    },
    {
      field: "description",
      headerName: "Popis",
      flex: 3,
      minWidth: 200,
      renderCell: ({ value }) => value || "–",
    },
    {
      field: "_actions",
      headerName: "",
      width: 90,
      sortable: false,
      // row = celý objekt jídla (přístup přes row.id, row.name atp.)
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => handleEdit(row)} title="Upravit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setDeleteError("");
              setDeleteTarget(row);
            }}
            title="Smazat"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Záhlaví stránky */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Knihovna jídel
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Přidat jídlo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}

      {/* DataGrid = tabulka s řazením, stránkováním a custom buňkami */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#F8F7FD",
              fontWeight: 600,
            },
          }}
        />
      </Paper>

      {/* Dialog pro přidání / úpravu jídla */}
      <DishFormDialog
        open={formOpen}
        dish={editDish}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Potvrzovací dialog pro smazání */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Smazat jídlo?"
        message={
          deleteTarget
            ? `Opravdu chcete smazat jídlo „${deleteTarget.name}"? Tuto akci nelze vrátit.`
            : ""
        }
        confirmLabel="Smazat"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

export default DishLibraryPage;
