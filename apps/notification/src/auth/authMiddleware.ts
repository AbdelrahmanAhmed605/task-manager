import { Response, NextFunction } from "express";
import { CognitoExpress } from "utils";
import { AuthRequest } from "../interfaces/types";
import dotenv from "dotenv";

dotenv.config();

const cognitoExpress = new CognitoExpress({
  region: process.env.AWS_REGION!,
  cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
  tokenUse: "access",
  tokenExpiration: Number(process.env.AWS_COGNITO_TOKEN_EXPIRATION!),
});

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let accessTokenFromClient = req.headers.accesstoken;

    if (typeof accessTokenFromClient !== "string") {
      return res.status(401).json({ message: "Unauthorized: Invalid Token" });
    }

    // Validate the token and get user information
    const user = await cognitoExpress.validate(accessTokenFromClient);

    req.user = user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token", error: error.message });
    } else {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token", error: String(error) });
    }
  }
};

export default authMiddleware;
