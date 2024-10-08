import { Router, Request, Response } from "express";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { fromContainerMetadata } from "@aws-sdk/credential-providers";
import { marshall } from "@aws-sdk/util-dynamodb";

interface NotificationRequest {
  userId: string;
  taskId: string;
}

const router = Router();

let client: DynamoDBClient;
let clientInitializationError: Error | null = null;

// Initialize DynamoDB client
try {
  client = new DynamoDBClient({
    region: process.env.AWS_REGION!,
    credentials: fromContainerMetadata(),
  });
} catch (error) {
  clientInitializationError = error as Error;
  console.error("Error initializing DynamoDB client:", error);
}

router.post(
  "/notification",
  async (req: Request<{}, {}, NotificationRequest>, res: Response) => {
    try {
      if (clientInitializationError) {
        throw new Error(clientInitializationError.message);
      }

      if (!process.env.DYNAMODB_TABLE_NAME) {
        throw new Error("Could not connect to database");
      }

      const { userId, taskId } = req.body;

      // Validate userId and taskId
      if (!userId || !taskId) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const oneYearInSeconds = 365 * 24 * 60 * 60;
      const ttlTimestamp = Math.floor(Date.now() / 1000) + oneYearInSeconds;

      const item = {
        PK: `${userId}`,
        SK: `NOTIFICATION#${uuidv4()}`,
        Notif_Task: `${taskId}`,
        NotificationTimestamp: new Date().toISOString(),
        NotificationExpiry: ttlTimestamp,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(item), // Convert item to DynamoDB AttributeValues
        ConditionExpression:
          "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      };

      const command = new PutItemCommand(params);

      try {
        const response = await client.send(command);

        return res.status(200).json({
          success: true,
          Notification: item,
          errors: [],
        });
      } catch (error) {
        console.error("Error creating notification:", error);
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        return res.status(500).json({
          success: false,
          errors: [{ key: "CreateError", error: errorMessage }],
        });
      }
    } catch (error) {
      console.error("Internal Server Error:", error);
      let errorMessage = "Internal Server Error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return res.status(500).json({
        success: false,
        errors: [{ key: "CreateError", error: errorMessage }],
      });
    }
  }
);

export default router;
