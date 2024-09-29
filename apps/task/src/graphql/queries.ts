import { formatISO } from "date-fns";
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  QueryCommandInput,
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
    { lastEvaluatedKey }: { lastEvaluatedKey?: Record<string, any> },
    context: ContextType
  ): Promise<any | undefined> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;
    const currentDate = formatISO(new Date(), { representation: "date" });

    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      IndexName: "TaskDueDateIndex",
      KeyConditionExpression: "begins_with(UserTaskKey, :userPrefix)",
      ExpressionAttributeValues: {
        ":userPrefix": { S: `USER#${userId}` },
        ":currentDate": { S: currentDate },
      },
      FilterExpression: "DueDate >= :currentDate",
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new QueryCommand(params);
    const response = await client.send(command);

    return {
      tasks: response.Items
        ? response.Items.map((item) => unmarshall(item))
        : [],
      lastEvaluatedKey: response.LastEvaluatedKey || null,
    };
  },
  task: async (
    _: any,
    { PK, SK }: { PK?: string; SK: string }, // Make PK optional
    context: ContextType
  ) => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;
    const finalPK = PK || `USER#${userId}`;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: {
        PK: { S: finalPK },
        SK: { S: SK },
      },
    };

    const command = new GetItemCommand(params);
    const response = await client.send(command);

    return response.Item ? unmarshall(response.Item) : null;
  },

  projects: async (parent: any, _: any, context: ContextType) => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;

    const projectParams: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
        ":skPrefix": { S: "PROJECT#" },
      },
    };

    const command = new QueryCommand(projectParams);
    const response = await client.send(command);

    return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
  },

  project: async (
    _: any,
    { PK, SK }: { PK: string; SK: string },
    context: ContextType
  ) => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;
    const finalPK = PK || `USER#${userId}`;

    const projectParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: {
        PK: { S: finalPK },
        SK: { S: SK },
      },
    };

    const projectCommand = new GetItemCommand(projectParams);
    const projectResponse = await client.send(projectCommand);

    if (!projectResponse.Item) {
      return null; // Return null if project is not found
    }

    const project = unmarshall(projectResponse.Item);

    const taskParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      FilterExpression: "ProjectID = :projectId",
      ExpressionAttributeValues: {
        ":pk": { S: finalPK },
        ":skPrefix": { S: "TASK#" },
        ":projectId": { S: SK },
      },
    };

    const taskCommand = new QueryCommand(taskParams);
    const taskResponse = await client.send(taskCommand);

    project.Tasks = taskResponse.Items
      ? taskResponse.Items.map((item) => unmarshall(item))
      : [];

    return project; // Return the project with its tasks
  },

  inboxTasks: async (
    _: any,
    { lastEvaluatedKey }: { lastEvaluatedKey?: Record<string, any> },
    context: ContextType
  ) => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;

    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      FilterExpression: "ProjectAssociation = :projectAssociation",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
        ":skPrefix": { S: "TASK#" },
        ":projectAssociation": { BOOL: false },
      },
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new QueryCommand(params);
    const response = await client.send(command);

    return {
      tasks: response.Items
        ? response.Items.map((item) => unmarshall(item))
        : [],
      lastEvaluatedKey: response.LastEvaluatedKey || null,
    };
  },
  tasksByDueDate: async (
    _: any,
    {
      dueDate,
      lastEvaluatedKey,
    }: { dueDate?: string; lastEvaluatedKey?: Record<string, any> },
    context: ContextType
  ): Promise<any | undefined> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to the database");
    }

    const userId = context?.user.sub;

    // Use today's date if no date is provided
    const targetDueDate =
      dueDate || formatISO(new Date(), { representation: "date" });

    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      IndexName: "TaskDueDateIndex",
      KeyConditionExpression:
        "DueDate = :dueDate AND begins_with(UserTaskKey, :userPrefix)",
      ExpressionAttributeValues: {
        ":dueDate": { S: targetDueDate },
        ":userPrefix": { S: `USER#${userId}` },
      },
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    // Execute the query
    const command = new QueryCommand(params);
    const response = await client.send(command);

    return {
      tasks: response.Items
        ? response.Items.map((item) => unmarshall(item))
        : [],
      lastEvaluatedKey: response.LastEvaluatedKey || null,
    };
  },
};
