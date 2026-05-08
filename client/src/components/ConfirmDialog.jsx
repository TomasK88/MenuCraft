// =====================================================
// components/ConfirmDialog.jsx - potvrzovací dialog
// -----------------------------------------------------
// Znovupoužitelná komponenta pro potvrzení nebezpečných akcí
// (smazání, přegenerování...). Zobrazí dialog s popisem akce
// a tlačítky "Zrušit" / "Potvrdit".
//
// Props:
//   open        - boolean, zda je dialog otevřený
//   title       - nadpis dialogu
//   message     - popis akce (co se stane)
//   onConfirm   - callback při kliknutí na potvrzení
//   onCancel    - callback při kliknutí na zrušení / zavření
//   confirmLabel - text potvrzovacího tlačítka (výchozí: "Potvrdit")
//   confirmColor - barva tlačítka: "error" | "warning" | "success" | "primary"
// =====================================================

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Potvrdit",
  confirmColor = "error",
}) {
  return (
    // Dialog = modální okno. onClose se zavolá při kliknutí mimo dialog nebo Escape.
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {/* DialogContentText zajistí správnou typografii a barvu textu */}
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {/* Šedé tlačítko pro zrušení - neprovede žádnou akci */}
        <Button onClick={onCancel} color="inherit">
          Zrušit
        </Button>
        {/* Barevné tlačítko pro potvrzení akce */}
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
