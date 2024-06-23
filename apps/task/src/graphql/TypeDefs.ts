import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar AWSDateTime

  type GraphQLError {
    key: String!
    error: String!
  }

  type Task {
    PK: String!
    SK: String!
    Title: String!
    Description: String
    Status: String!
    CreatedAt: AWSDateTime!
    TaskUpdatedAt: AWSDateTime
    TaskCompletedAt: AWSDateTime
    DueDate_NotificationSent: String!
    NotificationSent: Boolean!
    DueDate: AWSDateTime!
  }

  type PaginatedTasks {
    tasks: [Task]
    lastEvaluatedKey: String
  }

  input CreateTaskInput {
    Title: String!
    Description: String
    DueDate: AWSDateTime!
  }

  input UpdateTaskInput {
    TaskId: String!
    Title: String
    Description: String
    Status: String
    DueDate: AWSDateTime
  }

  type DeleteTaskResponse {
    success: Boolean!
    errors: [GraphQLError]
  }

  type MutationResponse {
    success: Boolean!
    Task: Task
    errors: [GraphQLError]
  }

  type Query {
    tasks(lastEvaluatedKey: String): PaginatedTasks
    task(taskId: String!): Task
  }

  type Mutation {
    createTask(input: CreateTaskInput!): MutationResponse
    updateTask(input: UpdateTaskInput!): MutationResponse
    deleteTask(taskId: String!): MutationResponse
  }
`;

export interface GraphQLError {
  key: string;
  error: string;
}

export interface Task {
  PK: string;
  SK: string;
  Title: string;
  Description?: string | null;
  Status: string;
  CreatedAt: string;
  TaskUpdatedAt?: string | null;
  TaskCompletedAt?: string | null;
  DueDate_NotificationSent: string;
  NotificationSent: boolean;
  DueDate: string;
}

export interface CreateTaskInput {
  Title: string;
  Description?: string | null;
  DueDate: Date;
}

export interface UpdateTaskInput {
  TaskId: string;
  Title?: string;
  Description?: string;
  Status?: string;
  DueDate?: Date;
  TaskCompletedAt?: string;
}

export interface DeleteTaskInput {
    taskId: string;
  }

export interface MutationResponse {
  success: boolean;
  Task?: Task | null;
  errors?: GraphQLError[];
}

export enum Status {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
