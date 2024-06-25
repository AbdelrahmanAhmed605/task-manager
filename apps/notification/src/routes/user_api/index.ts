import { Router, Response } from "express";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AuthRequest } from "../../interfaces/types";

const router = Router();

let client: DynamoDBClient;
let clientInitialized = false;

try {
  client = new DynamoDBClient({
    region: process.env.AWS_REGION!,
    credentials: fromEnv(),
  });
  clientInitialized = true;
} catch (error) {
  console.error("Error initializing DynamoDB client:", error);
}

router.get("/notifications", async (req: AuthRequest, res: Response) => {
  try {
    if (!clientInitialized) {
      throw new Error("DynamoDB client initialization failed");
    }

    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = req.user!.username;

    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      IndexName: "NotificationTimestampIndex",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
      },
      ScanIndexForward: false,
    };

    // Handle pagination if lastEvaluatedKey exists in the request query
    if (req.query.lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(
        req.query.lastEvaluatedKey as string
      );
    }

    const command = new QueryCommand(params);

    try {
      const response = await client.send(command);
      if (response.Items) {
        const notifications = response.Items.map((item) => unmarshall(item));
        return res.json({
          notifications,
          lastEvaluatedKey: response.LastEvaluatedKey || null,
        });
      } else {
        return res.json({
          notifications: [],
          lastEvaluatedKey: null,
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return res.status(500).json({
        message: "Failed to fetch notifications",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
