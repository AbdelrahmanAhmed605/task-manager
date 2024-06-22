import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { Email, FirstName, LastName, PhoneNumber } = ctx.args.input;
  const sub = ctx.identity.sub; // Get the Cognito sub from the identity context
  const now = util.time.nowISO8601();

  const item = {
    Email: Email,
    FirstName: FirstName || null,
    LastName: LastName || null,
    PhoneNumber: PhoneNumber || null,
    NotificationPreferences: {
      Email: false,
      SMS: false,
    },
    CreatedAt: now,
    UpdatedAt: now,
    LastLogin: now,
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${sub}`,
      SK: `USER#${sub}`,
    }),
    attributeValues: util.dynamodb.toMapValues(item),
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