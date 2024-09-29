import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBUpdateItemRequest,
  util,
} from "@aws-appsync/utils";
import { Response, MutationUpdateUserArgs } from "./types/AppSync";

export function request(
  ctx: Context<MutationUpdateUserArgs>
): DynamoDBUpdateItemRequest {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const sub = identity.sub;
  if (!identity || !sub) {
    return util.unauthorized();
  }

  const { FirstName, LastName } = ctx.args.input;
  const now = util.time.nowISO8601();

  const updateExpressionParts: string[] = [];
  const expressionNames: { [key: string]: string } = {};
  const expressionValues: { [key: string]: any } = {};

  if (FirstName !== undefined) {
    updateExpressionParts.push("#FirstName = :FirstName");
    expressionNames["#FirstName"] = "FirstName";
    expressionValues[":FirstName"] = FirstName;
  }

  if (LastName !== undefined) {
    updateExpressionParts.push("#LastName = :LastName");
    expressionNames["#LastName"] = "LastName";
    expressionValues[":LastName"] = LastName;
  }

  updateExpressionParts.push("#UpdatedAt = :UpdatedAt");
  expressionNames["#UpdatedAt"] = "UpdatedAt";
  expressionValues[":UpdatedAt"] = now;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${sub}`,
      SK: `USER#${sub}`,
    }),
    update: {
      expression:
        updateExpressionParts.length > 0
          ? `SET ${updateExpressionParts.join(", ")}`
          : "",
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
  };
}

export function response(ctx: Context<MutationUpdateUserArgs>): Response {
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
