import { Construct } from "constructs";
import {
  GraphqlApi,
  AuthorizationType,
  FieldLogLevel,
  Definition,
  Code,
  FunctionRuntime,
} from "aws-cdk-lib/aws-appsync";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as path from "path";

type AppSyncAPIProps = {
  apiName: string;
  table: ITable;
  userPoolId: string;
};

export const createAppSyncAPI = (scope: Construct, props: AppSyncAPIProps) => {
  const api = new GraphqlApi(scope, props.apiName, {
    name: props.apiName,
    definition: Definition.fromFile(
      path.join(__dirname, "graphql/schema.graphql")
    ),
    authorizationConfig: {
      defaultAuthorization: {
        authorizationType: AuthorizationType.USER_POOL,
        userPoolConfig: {
          userPool: UserPool.fromUserPoolId(
            scope,
            "UserPool",
            props.userPoolId
          ),
        },
      },
    },
    logConfig: {
      fieldLogLevel: FieldLogLevel.ALL,
    },
    xrayEnabled: true,
  });

  const dataSource = api.addDynamoDbDataSource("UserDS", props.table);

  // Create resolvers
  api.createResolver("createUserResolver", {
    typeName: "Mutation",
    fieldName: "createUser",
    dataSource: dataSource,
    runtime: FunctionRuntime.JS_1_0_0,
    code: Code.fromAsset(
      path.join(__dirname, "graphql/JS_functions/createUser.js")
    ),
  });

  api.createResolver("updateUserResolver", {
    typeName: "Mutation",
    fieldName: "updateUser",
    dataSource: dataSource,
    runtime: FunctionRuntime.JS_1_0_0,
    code: Code.fromAsset(
      path.join(__dirname, "graphql/JS_functions/updateUser.js")
    ),
  });

  api.createResolver("getUserByEmailResolver", {
    typeName: "Query",
    fieldName: "getUserByEmail",
    dataSource: dataSource,
    runtime: FunctionRuntime.JS_1_0_0,
    code: Code.fromAsset(
      path.join(__dirname, "graphql/JS_functions/getUserByEmail.js")
    ),
  });

  api.createResolver("getUserProfileResolver", {
    typeName: "Query",
    fieldName: "getUserProfile",
    dataSource: dataSource,
    runtime: FunctionRuntime.JS_1_0_0,
    code: Code.fromAsset(
      path.join(__dirname, "graphql/JS_functions/getUserProfile.js")
    ),
  });

  return { api, dataSource };
};
