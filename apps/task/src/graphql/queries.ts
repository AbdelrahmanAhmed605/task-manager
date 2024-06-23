import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  QueryCommandInput
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ContextType } from "./types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

export const Query = {
  tasks: async (
    _: any,
    { lastEvaluatedKey }: { lastEvaluatedKey: Record<string, any> },
    context: any
  ): Promise<any | undefined> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.username;

    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      IndexName: "UpdatedAtIndex",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
      },
      ScanIndexForward: false,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new QueryCommand(params);

    try {
      const response = await client.send(command);
      if (response.Items) {
        const tasks = response.Items.map((item) => unmarshall(item));
        return {
          tasks,
          lastEvaluatedKey: response.LastEvaluatedKey || null,
        };
      } else {
        return {
          tasks: [],
          lastEvaluatedKey: null,
        };
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching tasks");
    }
  },
  task: async (
    _: any,
    { taskId }: { taskId: string },
    context: ContextType
  ) => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.username;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: `${taskId}` },
      },
    };

    const command = new GetItemCommand(params);

    try {
      const response = await client.send(command);
      if (response.Item) {
        return unmarshall(response.Item);
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching task");
    }
  },
};
