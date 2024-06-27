import { Router } from "express";
import userApiRoutes from "./user_api";
import authMiddleware from "../auth/authMiddleware";
import lambdaApiRoutes from "./lambda_api"
import healthRoutes from "./service_health";

const router = Router();

router.use("/user", authMiddleware, userApiRoutes);
router.use("/lambda", lambdaApiRoutes);
router.use("/health", healthRoutes);

router.use((req, res) => {
  res.status(404).send("<h1>Wrong Route in /api/notifications!</h1>");
});

export default router;
