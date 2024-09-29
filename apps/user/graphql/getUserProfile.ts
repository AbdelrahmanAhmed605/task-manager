import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBGetItemRequest,
  util,
} from "@aws-appsync/utils";
import { User } from "./types/AppSync";

export function request(ctx: Context): DynamoDBGetItemRequest {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const sub = identity.sub;
  if (!identity || !sub) {
    return util.unauthorized();
  }

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${sub}`,
      SK: `USER#${sub}`,
    }),
  };
}

export function response(ctx: Context): User | null {
  if (ctx.error) {
    util.appendError(ctx.error.message, ctx.error.type);
    return null;
  }

  const item = ctx.result;
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
