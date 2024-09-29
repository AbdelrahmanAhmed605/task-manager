import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
  DeleteItemCommand,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from "uuid";
import {
  CreateTaskInput,
  CreateProjectInput,
  UpdateTaskInput,
  TaskMutationResponse,
  ProjectMutationResponse,
  TaskStatus,
  Task,
  Project,
  TaskPriority,
  DeleteTaskInput,
  UpdateProjectInput,
} from "./TypeDefs";
import { ContextType } from "./types";
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
} from "./zodSchema";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

export const Mutation = {
  createTask: async (
    _: any,
    { input }: { input: CreateTaskInput },
    context: ContextType
  ): Promise<TaskMutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;
    input.DueDate = input.DueDate
      ? new Date(input.DueDate).toISOString().split("T")[0]
      : new Date(Date.now()).toISOString().split("T")[0];

    // Validation Checks
    const validation = CreateTaskInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map((err) => ({
          key: err.path.join("."),
          error: err.message,
        })),
      };
    }

    const taskId = uuidv4();
    const isProjectTask = !!input.ProjectID;

    const item = {
      PK: `USER#${userId}`,
      SK: `TASK#${taskId}`,
      UserTaskKey: `USER#${userId}TASK#${taskId}`,
      Title: input.Title,
      Description: input.Description || null,
      Status: TaskStatus.TODO,
      Priority: input.Priority || TaskPriority.LOW,
      ProjectID: input.ProjectID || null,
      ProjectAssociation: isProjectTask,
      Labels: input.Labels || [],
      NotificationSent: false,
      Reminder: input.Reminder || false,
      ReminderTime: input.ReminderTime || null,
      DueDate: input.DueDate,
      TaskCompletedAt: null,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(
        Object.fromEntries(
          Object.entries(item).filter(([_, v]) => v !== undefined)
        )
      ),
    };

    const command = new PutItemCommand(params);
    const response = await client.send(command);

    if (!response) {
      return {
        success: false,
        errors: [
          {
            key: "CreateError",
            error: "Failed to create task.",
          },
        ],
      };
    }

    const createdTask = {
      ...item,
      TaskCompletedAt: null,
    };

    return {
      success: true,
      task: createdTask,
      errors: [],
    };
  },
  updateTask: async (
    _: any,
    { input }: { input: UpdateTaskInput },
    context: ContextType
  ): Promise<TaskMutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user?.sub ? `USER#${context.user.sub}` : input.PK;
    if (!userId || !input.SK) {
      throw new Error("Invalid input: userId and taskId are required.");
    }

    const itemKey = { PK: userId, SK: input.SK };

    // Validation Checks using Zod schema
    const validation = UpdateTaskInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map((err) => ({
          key: err.path.join("."),
          error: err.message,
        })),
      };
    }

    // Initialize update expression and attribute values
    let updateExpression = "SET TaskUpdatedAt = :taskUpdatedAt";
    const expressionAttributeValues: Record<string, any> = {
      ":taskUpdatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {};

    // Field mappings for update expression (excluding PK and SK)
    const fieldMappings: Partial<Record<keyof UpdateTaskInput, string>> = {
      Title: "Title",
      Description: "Description",
      NotificationSent: "NotificationSent",
      Status: "Status",
      DueDate: "DueDate",
      Reminder: "Reminder",
      ReminderTime: "ReminderTime",
      Labels: "Labels",
      Priority: "Priority",
      ProjectID: "ProjectID",
    };

    // Construct update expression from input
    for (const key of Object.keys(input) as Array<keyof UpdateTaskInput>) {
      const value = input[key];
      if (value !== undefined && fieldMappings[key]) {
        const attributeName = fieldMappings[key];
        if (key === "Status") {
          updateExpression += `, #${attributeName} = :${attributeName}`;
          expressionAttributeNames[`#${attributeName}`] =
            attributeName as string;
        } else {
          updateExpression += `, ${attributeName} = :${attributeName}`;
        }

        expressionAttributeValues[`:${attributeName}`] = value;
      }
    }

    if (input.ProjectID !== undefined) {
      const isProjectTask = !!input.ProjectID;
      updateExpression += `, ProjectAssociation = :projectAssociation`;
      expressionAttributeValues[":projectAssociation"] = isProjectTask;
    }

    const params: UpdateItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: marshall(itemKey),
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: ReturnValue.ALL_NEW,
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    const response = await client.send(new UpdateItemCommand(params));
    if (!response.Attributes) {
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

    const updatedTask = unmarshall(response.Attributes) as Task;
    return { success: true, task: updatedTask, errors: [] };
  },
  deleteTask: async (
    _: any,
    { PK, SK }: DeleteTaskInput,
    context: ContextType
  ): Promise<TaskMutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;
    const finalPK = PK || `USER#${userId}`;

    const itemKey = {
      PK: finalPK,
      SK: SK,
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall(itemKey),
    };

    const command = new DeleteItemCommand(params);
    const response = await client.send(command);

    if (!response) {
      return {
        success: false,
        errors: [
          {
            key: "DeleteError",
            error: "Failed to delete task.",
          },
        ],
      };
    }

    return {
      success: true,
      task: null,
      errors: [],
    };
  },
  createProject: async (
    _: any,
    { input }: { input: CreateProjectInput },
    context: ContextType
  ): Promise<ProjectMutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user.sub;

    // Validation Checks
    const validation = CreateProjectInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map((err) => ({
          key: err.path.join("."),
          error: err.message,
        })),
      };
    }

    const projectId = uuidv4();
    const item = {
      PK: `USER#${userId}`,
      SK: `PROJECT#${projectId}`,
      Title: input.Title,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(item),
    };

    const command = new PutItemCommand(params);
    const response = await client.send(command);

    if (!response) {
      return {
        success: false,
        errors: [
          {
            key: "CreateError",
            error: "Failed to create project.",
          },
        ],
      };
    }

    return {
      success: true,
      errors: [],
      project: item,
    };
  },
  updateProject: async (
    _: any,
    { input }: { input: UpdateProjectInput },
    context: ContextType
  ): Promise<ProjectMutationResponse> => {
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("Could not connect to database");
    }

    const userId = context?.user?.sub ? `USER#${context.user.sub}` : input.PK;
    if (!userId || !input.SK) {
      throw new Error("Invalid input: userId and projectId are required.");
    }

    const itemKey = { PK: userId, SK: input.SK };

    // Validation Checks
    const validation = UpdateProjectInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.errors.map((err) => ({
          key: err.path.join("."),
          error: err.message,
        })),
      };
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall(itemKey),
      UpdateExpression: "SET Title = :title, UpdatedAt = :updatedAt",
      ExpressionAttributeValues: marshall({
        ":title": input.Title,
        ":updatedAt": new Date().toISOString(),
      }),
      ReturnValues: ReturnValue.ALL_NEW,
    };

    const response = await client.send(new UpdateItemCommand(params));
    if (!response.Attributes) {
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

    const updatedProject = unmarshall(response.Attributes) as Project;

    // Return the successful response
    return {
      success: true,
      project: updatedProject,
      errors: [],
    };
  },
};
