"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SnackbarVariant = "success" | "error" | "warning" | "info";

interface SnackbarState {
  open: boolean;
  message: string;
  variant: SnackbarVariant;
}

interface SnackbarContextType {
  snackbar: SnackbarState;
  showSnackbar: (message: string, variant: SnackbarVariant) => void;
  closeSnackbar: () => void;
}

const defaultSnackbarContext: SnackbarContextType = {
  snackbar: {
    open: false,
    message: "",
    variant: "info", // Use the enum here
  },
  showSnackbar: () => {},
  closeSnackbar: () => {},
};

const SnackbarContext = createContext<SnackbarContextType>(
  defaultSnackbarContext
);

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    variant: "info",
  });

  const showSnackbar = (message: string, variant: SnackbarVariant) => {
    setSnackbar({ open: true, message, variant });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ snackbar, showSnackbar, closeSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};
