import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar AWSDateTime
  scalar AWSDate

  type GraphQLError {
    key: String!
    error: String!
  }

  enum TaskStatus {
    TODO
    COMPLETED
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type Project {
    PK: String! # e.g., USER#<UserID>
    SK: String! # e.g., PROJECT#<ProjectID>
    Title: String!
    CreatedAt: AWSDateTime!
    UpdatedAt: AWSDateTime
    Tasks: [Task]
  }

  type Task {
    PK: String! # e.g., USER#<UserID>
    SK: String! # e.g., TASK#<TaskID>
    UserTaskKey: String! #e.g., USER#<UserID>#TASK#<TaskID>
    ProjectID: String # e.g., PROJECT#<ProjectID>
    ProjectAssociation: Boolean!
    Title: String!
    Description: String
    Status: TaskStatus!
    Priority: TaskPriority!
    Labels: [String]
    NotificationSent: Boolean!
    Reminder: Boolean
    ReminderTime: AWSDateTime
    DueDate: AWSDate!
    TaskCompletedAt: AWSDateTime
    CreatedAt: AWSDateTime!
    UpdatedAt: AWSDateTime
  }

  type PaginatedTasks {
    tasks: [Task]
    lastEvaluatedKey: String
  }

  input CreateProjectInput {
    Title: String!
  }

  input UpdateProjectInput {
    PK: String
    SK: String!
    Title: String!
  }

  input CreateTaskInput {
    Title: String!
    Description: String
    DueDate: String
    Reminder: Boolean
    ReminderTime: String
    Labels: [String]
    Priority: TaskPriority
    ProjectID: String
  }

  input UpdateTaskInput {
    PK: String
    SK: String!
    Title: String
    Description: String
    Status: TaskStatus
    DueDate: String
    NotificationSent: Boolean
    Reminder: Boolean
    ReminderTime: String
    Labels: [String]
    Priority: TaskPriority
    ProjectID: String
  }

  type DeleteTaskResponse {
    success: Boolean!
    errors: [GraphQLError]
  }

  type TaskMutationResponse {
    success: Boolean!
    errors: [GraphQLError]
    Task: Task
  }

  type ProjectMutationResponse {
    success: Boolean!
    errors: [GraphQLError]
    project: Project
  }

  type Query {
    tasks(lastEvaluatedKey: String): PaginatedTasks
    task(PK: String, SK: String!): Task
    projects: [Project]
    project(PK: String, SK: String!): Project
    inboxTasks(lastEvaluatedKey: String): PaginatedTasks
    tasksByDueDate(dueDate: AWSDate, lastEvaluatedKey: String): PaginatedTasks
  }

  type Mutation {
    createTask(input: CreateTaskInput!): TaskMutationResponse
    updateTask(input: UpdateTaskInput!): TaskMutationResponse
    deleteTask(PK: String, SK: String!): TaskMutationResponse
    createProject(input: CreateProjectInput!): ProjectMutationResponse
    updateProject(input: UpdateProjectInput!): ProjectMutationResponse
  }
`;

// TypeScript interfaces
export interface GraphQLError {
  key: string;
  error: string;
}

export interface Task {
  PK: string;
  SK: string;
  UserTaskKey: string;
  ProjectID?: string | null;
  ProjectAssociation: boolean;
  Title: string;
  Description?: string | null;
  Status: TaskStatus;
  Priority: TaskPriority;
  Labels?: string[] | null;
  NotificationSent: boolean;
  Reminder?: boolean | null;
  ReminderTime?: string | null;
  DueDate: string;
  TaskCompletedAt?: string | null;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface CreateTaskInput {
  Title: string;
  Description?: string | null;
  DueDate: string;
  Reminder?: boolean | null;
  ReminderTime?: string | null;
  Labels?: string[] | null;
  Priority?: TaskPriority | null;
  ProjectID?: string | null;
}

export interface UpdateTaskInput {
  PK?: string;
  SK: string;
  Title?: string;
  Description?: string;
  NotificationSent?: boolean;
  Status?: TaskStatus;
  DueDate?: string;
  Reminder?: boolean;
  ReminderTime?: string;
  Labels?: string[] | null;
  Priority?: TaskPriority | null;
  ProjectID?: string | null;
}

export interface DeleteTaskInput {
  PK?: string;
  SK: string;
}

export interface TaskMutationResponse {
  success: boolean;
  task?: Task | null;
  errors?: GraphQLError[];
}

export interface ProjectMutationResponse {
  success: boolean;
  project?: Project | null;
  errors?: GraphQLError[];
}

export interface Project {
  PK: string;
  SK: string;
  Title: string;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface CreateProjectInput {
  Title: string;
}

export interface UpdateProjectInput {
  PK?: string;
  SK: string;
  Title: string;
}

export enum TaskStatus {
  TODO = "TODO",
  COMPLETED = "COMPLETED",
}

export const TaskStatusArray = [TaskStatus.TODO, TaskStatus.COMPLETED] as const;

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export const TaskPriorityArray = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
] as const;
