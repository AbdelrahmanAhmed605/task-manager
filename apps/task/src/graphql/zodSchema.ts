import { z } from "zod";
import { TaskStatusArray, TaskPriorityArray } from "./TypeDefs";

const AWSDateTime = z.coerce.string().datetime();

const AWSDate = z.coerce.string().refine(
  (val) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(val);
  },
  {
    message: "Invalid date format for AWSDate. Expected format: YYYY-MM-DD",
  }
);

const TaskStatusEnum = z.enum(TaskStatusArray);
const TaskPriorityEnum = z.enum(TaskPriorityArray);

// CreateTaskInput schema with validations
export const CreateTaskInputSchema = z
  .object({
    Title: z.string().min(1, "Title is required."),
    Description: z.string().optional().nullable(),
    DueDate: AWSDate.optional(),
    Reminder: z.boolean().optional().nullable(),
    ReminderTime: AWSDateTime.optional().nullable(),
    Labels: z.array(z.string()).optional().nullable(),
    Priority: TaskPriorityEnum.optional().nullable(),
    ProjectID: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const currentDate = new Date();
      const inputDueDate = data.DueDate ? new Date(data.DueDate) : null;
      const inputReminderTime = data.ReminderTime
        ? new Date(data.ReminderTime)
        : null;

      // 1. Check if DueDate is present and before the current day
      if (inputDueDate && inputDueDate < currentDate) {
        return false;
      }

      // 2. Check if Reminder is set to true and ReminderTime is provided
      if (data.Reminder && !data.ReminderTime) {
        return false;
      }

      // 3. Check if ReminderTime is set and Reminder is false
      if (data.Reminder === false && data.ReminderTime) {
        return false;
      }

      // 4. Ensure ReminderTime is not before the current day if it's set
      if (inputReminderTime && inputReminderTime < currentDate) {
        return false;
      }

      return true;
    },
    {
      message:
        "Validation failed: Please check DueDate and ReminderTime conditions.",
    }
  );

// UpdateTaskInput schema with validations
export const UpdateTaskInputSchema = z
  .object({
    Title: z.string().optional().nullable(),
    Description: z.string().optional().nullable(),
    Status: TaskStatusEnum.optional().nullable(),
    DueDate: AWSDate.optional().nullable(),
    NotificationSent: z.boolean().optional().nullable(),
    Reminder: z.boolean().optional().nullable(),
    ReminderTime: AWSDateTime.optional().nullable(),
    Labels: z.array(z.string()).optional().nullable(),
    Priority: TaskPriorityEnum.optional().nullable(),
    ProjectID: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const currentDate = new Date();
      const inputDueDate = data.DueDate ? new Date(data.DueDate) : null;
      const inputReminderTime = data.ReminderTime
        ? new Date(data.ReminderTime)
        : null;

      // Similar validation logic as in CreateTaskInputSchema
      if (inputDueDate && inputDueDate < currentDate) {
        return false;
      }

      if (data.Reminder && !data.ReminderTime) {
        return false;
      }

      if (data.Reminder === false && data.ReminderTime) {
        return false;
      }

      if (inputReminderTime && inputReminderTime < currentDate) {
        return false;
      }

      return true;
    },
    {
      message:
        "Validation failed: Please check DueDate and ReminderTime conditions.",
    }
  );

// CreateProjectInput schema
export const CreateProjectInputSchema = z.object({
  Title: z.string().min(1, "Title is required."),
});

// UpdateProjectInput schema
export const UpdateProjectInputSchema = z.object({
  Title: z.string().min(1, "Title is required."),
});
