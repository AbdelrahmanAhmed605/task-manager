import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBQueryRequest,
  util,
} from "@aws-appsync/utils";
import { QueryGetUserByEmailArgs, User } from "./types/AppSync";

export function request(
  ctx: Context<QueryGetUserByEmailArgs>
): DynamoDBQueryRequest {
  const identity = ctx.identity as AppSyncIdentityCognito;

  if (!identity || !identity.sub) {
    return util.unauthorized();
  }

  const Email = ctx.args.Email;

  return {
    operation: "Query",
    index: "EmailIndex",
    query: {
      expression: "Email = :Email",
      expressionValues: util.dynamodb.toMapValues({
        ":Email": Email,
      }),
    },
  };
}

export function response(ctx: Context<QueryGetUserByEmailArgs>): User | null {
  if (ctx.error) {
    util.appendError(ctx.error.message, ctx.error.type);
    return null;
  }

  const item = ctx.result.items[0];
  if (!item) {
    return null;
  }

  const { PK, SK } = item;
  if (!PK || !SK) {
    console.error(
      `PK or SK is null or undefined for item: ${JSON.stringify(item)}`
    );
    return null;
  }

  return item;
}
