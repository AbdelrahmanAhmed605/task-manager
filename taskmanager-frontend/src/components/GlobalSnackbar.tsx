"use client";

import { Snackbar, Alert } from "@mui/material";
import { useSnackbar } from "../contexts/SnackbarContext";

function GlobalSnackbar() {
  const { snackbar, closeSnackbar } = useSnackbar();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={closeSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        // onClose={closeSnackbar}
        severity={snackbar.variant}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}

export default GlobalSnackbar;
