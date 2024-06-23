import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from "uuid";
import {
  CreateTaskInput,
  UpdateTaskInput,
  MutationResponse,
  Status,
  Task,
  DeleteTaskInput,
} from "./TypeDefs";
import { ContextType } from "./types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

export const Mutation = {
  createTask: async (
    _: any,
    { input }: { input: CreateTaskInput },
    context: ContextType
  ): Promise<MutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.username;

    // Prepare the item to be put into DynamoDB
    const item = {
      PK: `USER#${userId}`,
      SK: `TASK#${uuidv4()}`,
      Title: input.Title,
      Description: input.Description,
      Status: Status.TODO,
      DueDate_NotificationSent: `${input.DueDate.toISOString()}_false`,
      NotificationSent: false,
      DueDate: input.DueDate.toISOString(),
      CreatedAt: new Date().toISOString(),
      TaskUpdatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(item), // Convert item to DynamoDB AttributeValues
    };

    const command = new PutItemCommand(params);

    try {
      const response = await client.send(command);

      const createdTask = {
        ...item,
        TaskCompletedAt: null,
      };
      return {
        success: true,
        Task: createdTask,
        errors: [],
      };
    } catch (error) {
      console.error("Error creating task:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        errors: [{ key: "CreateError", error: errorMessage }],
      };
    }
  },
  updateTask: async (
    _: any,
    { input }: { input: UpdateTaskInput },
    context: ContextType
  ): Promise<MutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.username;

    const itemKey = {
      PK: `USER#${userId}`,
      SK: `${input.TaskId}`,
    };

    // Prepare the update expression and attribute values
    let updateExpression = "SET TaskUpdatedAt = :taskUpdatedAt";
    const expressionAttributeValues: Record<string, any> = {
      ":taskUpdatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (input.Title !== undefined) {
      updateExpression += ", Title = :title";
      expressionAttributeValues[":title"] = input.Title;
    }
    if (input.Description !== undefined) {
      updateExpression += ", Description = :description";
      expressionAttributeValues[":description"] = input.Description;
    }
    if (input.Status !== undefined) {
      updateExpression += ", #status = :status";
      expressionAttributeValues[":status"] = input.Status;
      expressionAttributeNames["#status"] = "Status";
      if (input.Status === Status.COMPLETED) {
        updateExpression += ", TaskCompletedAt = :taskCompletedAt";
        expressionAttributeValues[":taskCompletedAt"] =
          new Date().toISOString();
      }
    }
    if (input.DueDate !== undefined) {
      updateExpression += ", DueDate = :dueDate";
      expressionAttributeValues[":dueDate"] = input.DueDate.toISOString();
    }

    let params;
    if (Object.keys(expressionAttributeNames).length > 0) {
      params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: marshall(itemKey),
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: ReturnValue.ALL_NEW,
      };
    } else {
      params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: marshall(itemKey),
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: ReturnValue.ALL_NEW,
      };
    }

    const command = new UpdateItemCommand(params);

    try {
      const response = await client.send(command);

      if (response.Attributes) {
        const updatedTask = unmarshall(response.Attributes) as Task;
        return {
          success: true,
          Task: updatedTask,
          errors: [],
        };
      } else {
        return {
          success: false,
          errors: [
            {
              key: "UpdateError",
              error: "No attributes returned from update operation",
            },
          ],
        };
      }
    } catch (error) {
      console.error("Error updating task:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        errors: [{ key: "UpdateError", error: errorMessage }],
      };
    }
  },
  deleteTask: async (
    _: any,
    { taskId }: DeleteTaskInput,
    context: ContextType
  ): Promise<MutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.username;

    const itemKey = {
      PK: `USER#${userId}`,
      SK: `${taskId}`,
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall(itemKey),
    };

    const command = new DeleteItemCommand(params);

    try {
      await client.send(command);

      return {
        success: true,
        Task: null,
        errors: [],
      };
    } catch (error) {
      console.error("Error deleting task:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        errors: [{ key: "DeleteError", error: errorMessage }],
      };
    }
  },
};
