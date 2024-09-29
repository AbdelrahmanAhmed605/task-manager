import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as dotenv from "dotenv";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as path from "path";

dotenv.config();

export class UserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = process.env.AWS_REGION!;
    const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    // Import the existing DynamoDB Table
    const table = dynamodb.Table.fromTableName(
      this,
      "ExistingTable",
      tableName
    );

    const api = new appsync.GraphqlApi(this, "user-api", {
      name: "user-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "../graphql/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: UserPool.fromUserPoolId(this, "UserPool", userPoolId),
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      xrayEnabled: true,
    });

    const dynamoDbDataSource = api.addDynamoDbDataSource("UserDS", table);

    // Create resolvers
    api.createResolver("createUserResolver", {
      typeName: "Mutation",
      fieldName: "createUser",
      dataSource: dynamoDbDataSource,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../graphql/build/createUser.js")
      ),
    });

    api.createResolver("updateUserResolver", {
      typeName: "Mutation",
      fieldName: "updateUser",
      dataSource: dynamoDbDataSource,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../graphql/build/updateUser.js")
      ),
    });

    api.createResolver("getUserByEmailResolver", {
      typeName: "Query",
      fieldName: "getUserByEmail",
      dataSource: dynamoDbDataSource,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../graphql/build/getUserByEmail.js")
      ),
    });

    api.createResolver("getUserProfileResolver", {
      typeName: "Query",
      fieldName: "getUserProfile",
      dataSource: dynamoDbDataSource,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../graphql/build/getUserProfile.js")
      ),
    });
  }
}
