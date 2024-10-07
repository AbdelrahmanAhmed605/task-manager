"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, SubmitHandler } from "react-hook-form";

import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tooltip,
  Paper,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";
import { makeStyles } from "@mui/styles";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface IFormInput {
  email: string;
  password: string;
}

interface IConfirmFormInput {
  confirmationCode: string;
}

interface ToastState {
  message: string;
  variant: "error" | "success";
}

const useStyles = makeStyles(() => ({
  tooltip: {
    padding: 0 + " !important",
  },
  arrow: {
    color: "gray !important",
  },
}));

export default function Signup() {
  const router = useRouter();
  const classes = useStyles();
  const { showSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const signupForm = useForm<IFormInput>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const confirmSignUpForm = useForm<IConfirmFormInput>({
    defaultValues: {
      confirmationCode: "",
    },
  });

  const handlePasswordValidation = (value: string) => {
    setPasswordValidations({
      length: value.length >= 8,
      lowercase: /[a-z]/.test(value),
      uppercase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      specialChar: /[!@#$%^&*()\-_=+{}[\]`~:;"'<>.,/\\|]/.test(value),
    });
  };

  const onSignUpSubmit: SubmitHandler<IFormInput> = async (data) => {
    setLoading(true);
    const response = await fetch("/api/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
      showSnackbar(result.message, "success");
      setShowConfirmation(true);
      setEmail(data.email);
      setPassword(data.password);
    } else {
      showSnackbar(result.message, "error");
    }

    setLoading(false);
  };

  const onConfirmSignUpSubmit: SubmitHandler<IConfirmFormInput> = async (
    data
  ) => {
    setLoading(true);

    const submitData = {
      code: data.confirmationCode,
      email: email,
      password: password,
    };
    const response = await fetch("/api/confirm-signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    });

    const result = await response.json();
    if (response.ok) {
      showSnackbar(result.message, "success");
      router.push("/");
    } else {
      showSnackbar(result.message, "error");
    }

    setLoading(false);
  };

  const handleResendCode = async () => {
    const response = await fetch("/api/resend-signup-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    if (response.ok) {
      showSnackbar(result.message, "success");
    } else {
      showSnackbar(result.message, "error");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      {!showConfirmation ? (
        <form
          key="signupForm-1"
          onSubmit={signupForm.handleSubmit(onSignUpSubmit)}
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: 3,
              boxShadow: 3,
              borderRadius: 2,
              gap: 2,
              bgcolor: "#ffffff",
            }}
          >
            <Typography variant="h5" mb={2}>
              Sign Up
            </Typography>

            {/* Email Field */}
            <Controller
              name="email"
              control={signupForm.control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email address",
                },
              }}
              render={({ field }) => (
                <TextField
                  fullWidth
                  id="email"
                  label="Email"
                  autoComplete="email"
                  {...field}
                  error={!!signupForm.formState.errors.email}
                  helperText={
                    signupForm.formState.errors.email
                      ? signupForm.formState.errors.email.message
                      : ""
                  }
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={signupForm.control}
              rules={{
                required: "Password is required",
              }}
              render={({ field }) => {
                return (
                  <Tooltip
                    classes={{
                      tooltip: classes.tooltip,
                      arrow: classes.arrow,
                    }}
                    disableHoverListener
                    arrow
                    placement="top"
                    title={
                      <Paper sx={{ padding: 2, bgcolor: "#ffffff" }}>
                        <Typography sx={{ color: "black" }} variant="subtitle1">
                          Requirements:
                        </Typography>
                        <List dense sx={{ padding: 0 }}>
                          <ListItem sx={{ padding: 0 }}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: passwordValidations.length
                                    ? "green"
                                    : "grey",
                                  mr: 1,
                                }}
                              >
                                {passwordValidations.length ? (
                                  <CheckIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                ) : (
                                  <RemoveIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                )}
                              </Box>
                              <ListItemText
                                secondary="At least 8 characters"
                                sx={{ paddingLeft: 0 }}
                              />
                            </Box>
                          </ListItem>
                          <ListItem sx={{ padding: 0 }}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: passwordValidations.lowercase
                                    ? "green"
                                    : "grey",
                                  mr: 1,
                                }}
                              >
                                {passwordValidations.lowercase ? (
                                  <CheckIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                ) : (
                                  <RemoveIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                )}
                              </Box>
                              <ListItemText
                                secondary="At least 1 lowercase letter"
                                sx={{ paddingLeft: 0 }}
                              />
                            </Box>
                          </ListItem>
                          <ListItem sx={{ padding: 0 }}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: passwordValidations.uppercase
                                    ? "green"
                                    : "grey",
                                  mr: 1,
                                }}
                              >
                                {passwordValidations.uppercase ? (
                                  <CheckIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                ) : (
                                  <RemoveIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                )}
                              </Box>
                              <ListItemText
                                secondary="At least 1 uppercase letter"
                                sx={{ paddingLeft: 0 }}
                              />
                            </Box>
                          </ListItem>
                          <ListItem sx={{ padding: 0 }}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: passwordValidations.number
                                    ? "green"
                                    : "grey",
                                  mr: 1,
                                }}
                              >
                                {passwordValidations.number ? (
                                  <CheckIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                ) : (
                                  <RemoveIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                )}
                              </Box>
                              <ListItemText
                                secondary="At least 1 number"
                                sx={{ paddingLeft: 0 }}
                              />
                            </Box>
                          </ListItem>
                          <ListItem sx={{ padding: 0 }}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: passwordValidations.specialChar
                                    ? "green"
                                    : "grey",
                                  mr: 1,
                                }}
                              >
                                {passwordValidations.specialChar ? (
                                  <CheckIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                ) : (
                                  <RemoveIcon
                                    sx={{ color: "white", fontSize: 12 }}
                                  />
                                )}
                              </Box>
                              <ListItemText
                                secondary="At least 1 special character"
                                sx={{ paddingLeft: 0 }}
                              />
                            </Box>
                          </ListItem>
                        </List>
                      </Paper>
                    }
                  >
                    <TextField
                      fullWidth
                      id="password"
                      label="Password"
                      type="password"
                      autoComplete="new-password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handlePasswordValidation(e.target.value);
                      }}
                      error={!!signupForm.formState.errors.password}
                      helperText={
                        signupForm.formState.errors.password
                          ? signupForm.formState.errors.password.message
                          : ""
                      }
                    />
                  </Tooltip>
                );
              }}
            />

            <Button
              variant="contained"
              type="submit"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={24} /> : null}
            >
              Sign Up
            </Button>
          </Box>
        </form>
      ) : (
        <form
          key="confirmSignUpForm-2"
          onSubmit={confirmSignUpForm.handleSubmit(onConfirmSignUpSubmit)}
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: 3,
              bgcolor: "#ffffff",
              boxShadow: 3,
              borderRadius: 2,
              maxWidth: 400,
              width: "100%",
            }}
          >
            <Typography variant="h5" mb={2}>
              Confirm Sign Up
            </Typography>
            <Controller
              name="confirmationCode"
              control={confirmSignUpForm.control}
              rules={{
                required: "Confirmation code is required",
              }}
              render={({ field }) => (
                <TextField
                  id="confirmationCode"
                  fullWidth
                  label="Confirmation Code"
                  autoComplete="off"
                  {...field}
                  error={!!confirmSignUpForm.formState.errors.confirmationCode}
                  helperText={
                    confirmSignUpForm.formState.errors.confirmationCode
                      ? confirmSignUpForm.formState.errors.confirmationCode
                          .message
                      : ""
                  }
                />
              )}
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={24} /> : null}
            >
              Confirm
            </Button>
            <Button onClick={handleResendCode} variant="text">
              Resend Confirmation Code
            </Button>
          </Box>
        </form>
      )}
    </Box>
  );
}
