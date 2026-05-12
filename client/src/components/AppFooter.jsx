import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const VERSION = "1.0.0";

export default function AppFooter() {
  return (
    <Box component="footer" sx={{ textAlign: "center", py: 2, mt: 4 }}>
      <Typography variant="caption" color="text.disabled">
        MenuCraft v{VERSION}
      </Typography>
    </Box>
  );
}
