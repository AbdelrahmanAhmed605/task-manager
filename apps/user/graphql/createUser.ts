import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBPutItemRequest,
  util,
} from "@aws-appsync/utils";
import { MutationCreateUserArgs, Response } from "./types/AppSync";

export function request(
  ctx: Context<MutationCreateUserArgs>
): DynamoDBPutItemRequest {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const sub = identity.sub;
  if (!identity || !sub) {
    return util.unauthorized();
  }

  const { Email, FirstName, LastName } = ctx.args.input;
  const now = util.time.nowISO8601();

  const item = {
    Email: Email,
    FirstName: FirstName ? FirstName : undefined,
    LastName: LastName ? LastName : undefined,
    CreatedAt: now,
    UpdatedAt: now,
    LastLogin: now,
  };

  return {
    operation: "PutItem",
    key: {
      PK: util.dynamodb.toDynamoDB(`USER#${sub}`),
      SK: util.dynamodb.toDynamoDB(`USER#${sub}`),
    },
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(ctx: Context<MutationCreateUserArgs>): Response {
  if (ctx.error) {
    return {
      success: false,
      errors: [
        {
          message:
            ctx.error.message ||
            "An error occurred while processing your request. Please try again later.",
          type: ctx.error.type || "UNKNOWN_ERROR",
        },
      ],
      user: null,
    };
  }

  return {
    success: true,
    errors: [],
    user: ctx.result,
  };
}
