import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as dotenv from 'dotenv';
import { createAppSyncAPI } from './api/appsync';

dotenv.config();

export class UserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = process.env.AWS_REGION!;
    const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    // Import the existing DynamoDB Table
    const table = dynamodb.Table.fromTableName(this, 'ExistingTable', tableName);

    // Create AppSync API
    const api = createAppSyncAPI(this, {
      apiName: 'UserApi',
      table,
      userPoolId,
    });
  }
}
