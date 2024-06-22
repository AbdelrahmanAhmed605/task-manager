import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { FirstName, LastName, PhoneNumber, NotificationPreferences } = ctx.args.input;
  const sub = ctx.identity.sub; // Get the Cognito sub from the identity context
  const now = util.time.nowISO8601();

  // Initialize update expression parts and expression values
  const updateExpressionParts = [];
  const expressionNames = {};
  const expressionValues = {};

  // Build update expression based on provided fields
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

  if (PhoneNumber !== undefined) {
    updateExpressionParts.push("#PhoneNumber = :PhoneNumber");
    expressionNames["#PhoneNumber"] = "PhoneNumber";
    expressionValues[":PhoneNumber"] = PhoneNumber;
  }

  if (NotificationPreferences !== undefined) {
    // Assuming NotificationPreferences is an object
    updateExpressionParts.push("#NotificationPreferences = :NotificationPreferences");
    expressionNames["#NotificationPreferences"] = "NotificationPreferences";
    expressionValues[":NotificationPreferences"] = NotificationPreferences;
  }

  // Always update the updatedAt field
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
      expression: updateExpressionParts.length > 0 ? `SET ${updateExpressionParts.join(", ")}` : "",
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return {
      success: false,
      errors: [
        {
          message: ctx.error.message,
          locations: ctx.error.locations,
          path: ctx.error.path,
          extensions: ctx.error.extensions,
        },
      ],
    };
  }
  return {
    success: true,
    errors: [],
  };
}
