# Task Management Application

This project is a Task Management Application where users can experience the intricacies of creating, managing, and tracking tasks within a cloud-based environment. The project was designed to learn and explore the deployment of a microservices architecture using an AWS infrastructure.

## Table of Contents
- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [DynamoDB Schema Overview](#dynamodb-schema-overview)
- [Data Flow](#data-flow)
- [AWS Services](#aws-services)
- [Project Plan](#project-plan)
- [License](#license)

## Overview

The Task Management Application provides the following features:

### User Management
- Users can register for an account.
- Users can log in and log out.
- Users can update their profile information.

### Task Management
- Users can create new tasks.
- Users can view a list of their tasks.
- Users can update existing tasks.
- Users can delete tasks.
- Tasks can have titles, descriptions, due dates, and statuses (e.g., pending, in progress, completed).

### Notification System
- Users receive notifications for upcoming task deadlines.
- Users receive notifications when tasks are completed.

### User Interface
- Responsive web interface using Next.js.
- Intuitive design for managing tasks.
- Visual indicators for task status and due dates.

## Architecture Diagram

![AWS (2019) horizontal framework - Page 1](https://github.com/AbdelrahmanAhmed605/task-manager/assets/98119874/6778218c-7755-4400-b411-0d05c4073d01)


## DynamoDB Schema Overview

### 1. Introduction

This DynamoDB schema is designed to efficiently store and retrieve user data, tasks, and notifications. It utilizes a combination of partition keys, sort keys, global secondary indexes (GSIs), and local secondary indexes (LSIs) to support various access patterns and query requirements.

### 2. Query and Access Patterns

- **Creating Users:** Each user is uniquely identified by a UUID and stored with the partition key `EntityPartition` and sort key `EntitySort` as `USER_<UUID>`.
- **Creating Tasks:** Tasks associated with a user are stored with the partition key as `USER_<UserID>` and sort key as `TASK_<TaskID>`.
- **Creating Notifications:** Notifications linked to users and tasks are stored with the partition key as `USER_<UserID>` and sort key as `NOTIF_<NotificationID>`.
- **Query by Email:** The `EmailIndex` facilitates querying by email address for user registration and login.
- **Query User Tasks and Notifications:** Tasks and notifications for a user are efficiently retrieved using the partition key `USER_<UserID>` and sorting by `TASK_` or `NOTIF_`.
- **Daily Task Notification:** A scheduled Lambda function queries the `NotificationSentIndex` to find tasks where `NotificationSent` is false and are due the next day to send a notification

### 3. Attributes and Data Types

- **EntityPartition (Partition Key):** String - Defines the entity type and uniquely identifies partitions.
- **EntitySort (Sort Key):** String - Represents the specific entity within a partition.
  - Values: `USER_<UserID>`, `TASK_<TaskID>`, `NOTIF_<NotificationID>`
  - For `USER_`, attributes include Email, Password, FirstName, LastName, PhoneNumber, NotificationPreferences, CreatedAt, UpdatedAt, LastLogin.
  - For `TASK_`, attributes include Title, Description, Status, NotificationSent, DueDate, CreatedAt, TaskUpdatedAt, TaskCompletedAt.
  - For `NOTIF_`, attributes include Notif_Timestamp, Notif_isRead, NotificationTTL
- **Email:** String - User's email address.
- **Password:** String - User's password (hashed for security).
- **FirstName:** String - User's first name.
- **LastName:** String - User's last name.
- **PhoneNumber:** String - User's phone number.
- **NotificationPreferences:** Object - User's notification preferences, containing the fields email and SMS (Boolean).
- **LastLogin:** DateTime - Timestamp of the user's last login.
- **Title:** String - Title of the task.
- **Description:** String - Description of the task.
- **Status:** String - Status of the task (e.g., pending, completed).
- **NotificationSent:** Boolean - Indicates whether a notification has been sent for the task.
- **DueDate:** DateTime - Due date for tasks.
- **DueDate_NotificationSent:** String - Composite key combining due date and notification status for efficient querying.
- **TaskUpdatedAt:** DateTime - Timestamp of the task's last update.
- **TaskCompletedAt:** DateTime - Timestamp of when the task was completed.
- **Notif_isRead:** Boolean - Indicates whether a notification has been read.
- **Notif_Timestamp:** DateTime - Timestamp of notification creation.
- **NotificationTTL:** Number - Time-to-live (TTL) attribute for notifications to automatically delete old notifications from the table to keep dataset manageable and reduce storage costs
- **CreatedAt:** DateTime - Timestamp of entity creation.
- **UpdatedAt:** DateTime - Timestamp of entity update.

### 4. Global Secondary Indexes (GSIs) and Local Secondary Indexes (LSIs)

- **GSIs:**
  - **EmailIndex:** `PK: Email` - Used when we want to ensure email uniqueness when a user is signing up, and also for facilitating login queries (to find the user with the submitted email and their corresponding password)
  - **NotificationSentIndex:** `PK: DueDate_NotificationSent` - Query tasks where `NotificationSent` is false and are due the next day to send out notification alerts.

- **LSIs:**
  - **UpdatedAtIndex:** `PK: EntityPartition (USER_<UserID>)`, `SK: TaskUpdatedAt` - Query tasks for a user sorted by the most recently updated tasks.
  - **NotificationTimestampIndex:** `PK: EntityPartition (USER_<UserID>)`, `SK: Notif_Timestamp` - Query notifications for a user sorted by when they were received.

### 5. Considerations for Schema Design

- **EntityPartition and EntitySort:** These keys allow for the storage of various types of data (users, tasks, notifications) within the same table, facilitating efficient querying and management.
- **DueDate_NotificationSent:** A composite key combining due date and notification status for the `NotificationSentIndex`, enabling even data distribution and efficient querying of tasks for daily notifications. If NotificationSent was selected as the partition key instead, then we would only have 2 partitions (true and false), which is not a good distribution.`
- **TaskUpdatedAt and Notif_Timestamp:** These attributes serve as sort keys for the LSIs, `UpdatedAtIndex` and `NotificationTimestampIndex`, respectively. By utilizing these dedicated sort keys for tasks and notifications, we ensure that only relevant data is retrieved when querying for the most recently updated tasks or notifications. This approach eliminates the need for additional filtering and enhances query efficiency.
    - If instead of TaskUpdatedAt, we used UpdatedAt (which is also used for users), then the composite primary key for the LSI would return both user and task data and we would need to filter out the results. By using TaskUpdatedAt which is only applied to tasks, the composite primary key will only return task data


### 6. Limitations

- **Top-Level Attributes:** Storing a large number of top-level attributes may lead to increased storage costs and potential performance degradation. It might be worth it to evaluate the necessity of each attribute and consider alternative data modeling strategies such as using nested attributes to optimize data organization and access patterns.
- **Index Maintenance:** Maintaining Global Secondary Indexes (GSIs) and Local Secondary Indexes (LSIs) can increase costs and complexity. Each index requires additional storage and write capacity units, and inefficient use can lead to increased operational costs.
- **Write Capacity Consumption:** DynamoDB’s provisioned throughput model means that write-heavy operations (like frequent task updates) can consume a significant amount of write capacity, potentially leading to throttling if not properly managed.
- **Hot Partitions:** Regular monitoring of data distribution and cardinality of composite keys is essential to avoid hot partitions and ensure scalability.

## Data Flow

### High-Level Overview

![AWS (2019) horizontal framework](https://github.com/AbdelrahmanAhmed605/task-manager/assets/98119874/6eef05a6-9d73-47ae-b33f-e497a8a8dbd2)


### 1. User Registration and Authentication:

- When a user registers for an account, their registration data (including username, email, and password) is collected by the application frontend.
- The application frontend securely sends this registration data to the backend.
- The backend integrates with AWS Cognito as the user authentication and management service.
- The backend submits the registration data to AWS Cognito's user pool through the Cognito API.
- AWS Cognito handles user authentication, validation, and storage of user data, including password encryption.
- Upon successful registration, AWS Cognito returns authentication tokens (e.g., ID token, access token) to the backend.
- The backend stores these tokens and sends them back to the frontend in the response.
- The frontend securely stores these tokens for subsequent authenticated requests.
- The backend creates a new record in the Users table in DynamoDB, storing the user's profile information.
- The LastLogin attribute in the Users table is updated to reflect the user's last login time, ensuring accurate tracking of user activity and engagement.

### 2. User Login and Profile Management:

- When a user logs in to their account, their credentials are collected by the application frontend.
- The frontend sends these credentials to the backend.
- The backend sends the credentials to AWS Cognito's user pool through the Cognito API for authentication.
- Upon successful authentication, AWS Cognito generates authentication tokens (e.g., ID token, access token) and returns them to the backend.
- The backend sends these tokens to the frontend.
- The frontend securely stores these tokens for subsequent authenticated requests.
- For subsequent authenticated requests, the frontend includes these tokens in the request headers.
- The backend verifies the tokens with AWS Cognito to ensure the user's identity and authorization.
- Once the user is authenticated, they can access the application interface and manage their profile information.
- When a user updates their profile information, the changes are submitted to the backend.
- The backend validates the authentication tokens with AWS Cognito to ensure the user's identity and authorization.
- If the authentication tokens are valid, the backend processes the profile update request and updates the corresponding records in the Users table in DynamoDB.

### 3. Task Management
- **Task Creation:**
  - Users create new tasks through the application interface, providing details such as the task title, description, due date, and status.
  - The application backend processes the task creation request and inserts a new record into the Tasks table in DynamoDB, associating the task with the respective user (identified by `USER_<UserID>`).
- **Task Viewing, Updating, and Deleting:**
  - Users can view, update, and delete tasks through the application interface, which involves querying and modifying records in the Tasks table accordingly.
  - Task status updates and completion actions are reflected in the `Status` and `TaskCompletedAt` attributes of the corresponding task records.

### 4. Notification Subscription and Delivery
- **User Notification Preferences:**
  - Users manage their notification preferences (email/SMS) through the application interface.
  - Preferences are stored in the `NotificationPreferences` field in the Users table.

- **Scheduled Batch Processing:**
  - A scheduled Lambda function, triggered by a CloudWatch Event (could be run once or twice a day), periodically checks for tasks due within the next 24 hours.
  - The Lambda function queries the Tasks table for tasks due the next day and have `NotificationSent` set to false. The `DueDate_NotificationSent` composite attribute is used for efficient querying.

- **Notification Delivery:**
  - When the Lambda function finds tasks due within the next day with `NotificationSent` set to false, it sends the notifications and updates the `NotificationSent` flag to true.
  - Before publishing the notifications, the Lambda function checks the `NotificationPreferences` of the corresponding user in the Users table to determine whether to send email or SMS notifications, or just show an in-app notification (default).

- **In-App Notifications:**
  - For in-app notifications (default), the Lambda function logs the notification in the Notifications table.
  - When a user logs back into the app, new notifications appear in the notifications tab. Initially, this will involve periodic polling of the DynamoDB database for new notifications for the user. Implementing WebSockets later can provide real-time notifications.

- **SNS Topics and Lambda Functions:**
  - If a user has opted in for email/SMS notifications, the Lambda function publishes the notification to the appropriate SNS topic.
  - There will be 4 SNS topics: `TaskDueNotificationsEmailTopic`, `TaskDueNotificationsSMSTopic`, `TaskCompletedNotificationsEmailTopic`, `TaskCompletedNotificationsSMSTopic`.

- **Updating Task Due Date:**
  - If a user updates a task's due date, the task will be picked up by the periodic Lambda function when it's within the new notification timeframe.

### 5. Viewing Notification History
- **Accessing Notification History:**
  - Users can access their notification history through the application interface.
  - The application backend queries the Notifications table for the logged-in user's notifications using the `USER_<UserID>` partition key and the `Notif_Timestamp` sort key.
  - The backend returns the list of notifications, which is then displayed in the user's interface.
- **NotificationTTL:**
  - Notifications are automatically deleted after a specified period using the `NotificationTTL` attribute, which acts as a time-to-live (TTL) mechanism.
  - **Benefits of TTL:**
    - Automatically removing old notifications helps manage the size of the Notifications table, ensuring it doesn't grow excessively large over time.
    - This improves the performance of queries by keeping the dataset manageable.
    - It also reduces storage costs by eliminating unnecessary old data.


## AWS Services

- **API Gateway:** Manages APIs for the application.
- **Amazon DynamoDB:** Stores user and task data.
- **ECR (Elastic Container Registry):** Stores container images.
- **ECS (Elastic Container Service):** Runs backend services using ECS tasks and ECS Fargate.
- **NAT Gateway:** Allows outbound traffic from the ECS backend to DynamoDB and ECR containers.
- **Application Load Balancer (ALB):** Distributes load among backend services.
- **Route 53:** Manages domain names and DNS routing.
- **Amplify:** Hosts the Next.js (React) frontend, utilizing S3 and CloudFront for global CDN delivery.

### Frontend Deployment

- **AWS Amplify:** Hosts the Next.js (React) frontend.
- **CloudFront:** Ensures fast global delivery of the frontend through a CDN.

### Database

- **Amazon DynamoDB:** Stores user and task data.

### CI/CD Pipeline

- **AWS CodePipeline:** Manages the CI/CD workflow.
- **AWS CodeBuild:** Builds and tests the code.
- **AWS CodeDeploy:** Deploys the application.
- **Jenkins:** Provides additional CI/CD capabilities integrated with AWS CodePipeline and CodeDeploy.

### Authentication

- **Amazon Cognito:** Manages user authentication, registration, and profile management.

### Monitoring and Logging

- **CloudWatch:** Monitors applications and AWS resources, collects and tracks metrics, and logs.

### Secrets Management

- **Secrets Manager:** Manages secrets like database credentials and API keys.

### Networking

- **VPC (Virtual Private Cloud):** Isolates network resources securely.
- **Internet Gateway:** Allows internet access for resources within the VPC.
- **NAT Gateway:** Allows outbound internet access for resources in private subnets.


## Project Plan

### Phase 1: Planning Setup

#### Project Planning
- Define the scope and requirements of the application.
- Design the architecture diagram, showing how different services will interact.

### Phase 2: Infrastructure Setup

#### Networking
- VPC: Create a Virtual Private Cloud (VPC) with appropriate subnets (public/private), route tables, and security groups.
- Route 53: Set up domain name management for your application.
- Internet Gateway: Allow internet access for resources within the VPC.
- NAT Gateway: Set up NAT Gateway to allow outbound internet access for resources in private subnets.

#### Database
- Amazon DynamoDB: Set up a DynamoDB database for storing user and task data. Configure initial database schema.

#### Secrets Management
- Secrets Manager: Store database credentials, API keys, and other secrets securely.

### Phase 3: Backend Development

#### Microservices Development
- User Service: Implement user authentication and profile management.
- Task Service: Implement task creation, updating, and deletion functionalities.
- Notification Service: Implement notifications for due or completed tasks.

#### Containerization
- Containerize each microservice using Docker.

#### ECS Setup
- ECS: Set up Elastic Container Service to run backend services.
- Fargate: Use Fargate for serverless container management.
- ALB: Configure Application Load Balancer to distribute traffic among ECS services.

#### API Gateway
- Set up API Gateway to route requests to the appropriate microservice.

### Phase 4: Frontend Development

#### Frontend Implementation
- Develop the frontend using Next.js (React) for the task management application.
- Ensure the frontend communicates correctly with the backend services.

#### Static File Hosting
- AWS Amplify: Host static files of the Next.js frontend using AWS Amplify.
- CloudFront: Set up CloudFront CDN to ensure fast delivery of the frontend globally.

### Phase 5: Continuous Integration and Continuous Deployment (CI/CD)

#### CI/CD Pipeline Setup
- **AWS CodePipeline:** Create a pipeline to manage the CI/CD workflow.
- **AWS CodeBuild:** Configure builds and tests.
- **AWS CodeDeploy:** Automate deployments.
- **Jenkins:** Integrate Jenkins for additional CI/CD capabilities.

### Phase 6: Authentication

#### User Authentication
- **Amazon Cognito:** Set up Cognito for user authentication, registration, and profile management.

### Phase 7: Monitoring and Logging

#### Monitoring and Logging
- **CloudWatch:** Set up CloudWatch for monitoring applications and AWS resources, collecting and tracking metrics, and logging.

### Phase 8: Testing and Deployment

#### End-to-End Testing
- Perform comprehensive testing, including unit tests and integration tests
- Ensure all services are working together as expected.

#### Deployment
- Deploy the application to the production environment using the CI/CD pipeline.

#### Post-Deployment Monitoring
- Continuously monitor the application using CloudWatch.
- Set up alerts for critical metrics and issues.

## License

This project is licensed under the MIT License.

