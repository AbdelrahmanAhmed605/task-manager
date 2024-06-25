import { Router } from "express";
import userApiRoutes from "./user_api";
import authMiddleware from "../auth/authMiddleware";
import lambdaApiRoutes from "./lambda_api"

const router = Router();

router.use("/user", authMiddleware, userApiRoutes);
router.use("/lambda", lambdaApiRoutes);

router.use((req, res) => {
  res.send("<h1>Wrong Route!</h1>");
});

export default router;
