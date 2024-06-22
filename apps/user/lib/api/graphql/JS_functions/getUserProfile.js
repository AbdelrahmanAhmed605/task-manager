import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const sub = ctx.identity.sub;
  console.log(JSON.stringify(ctx.identity, null, 4));

  return {
    operation: "Query",
    query: {
      expression: "#PK = :PK AND #SK = :SK",
      expressionNames: {
        "#PK": "PK",
        "#SK": "SK",
      },
      expressionValues: {
        ":PK": util.dynamodb.toDynamoDB(`USER#${sub}`),
        ":SK": util.dynamodb.toDynamoDB(`USER#${sub}`),
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
    return null;
  }

  const items = ctx.result.items;

  if (!items || items.length === 0) {
    return null;
  }

  const item = items[0];

  const { PK, SK, NotificationPreferences } = item;

  if (!PK || !SK) {
    console.error(
      `PK or SK is null or undefined for item: ${JSON.stringify(item)}`
    );
    return null;
  }

  const notificationPreferences = {
    Email: NotificationPreferences?.Email || false,
    SMS: NotificationPreferences?.SMS || false,
  };

  const resultItem = {
    ...item,
    NotificationPreferences: notificationPreferences,
  };

  return resultItem;
}
