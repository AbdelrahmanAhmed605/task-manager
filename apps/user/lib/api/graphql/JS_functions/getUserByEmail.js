import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const Email = ctx.args.Email;

  const expression = "Email = :Email";
  const expressionValues = util.dynamodb.toMapValues({ ":Email": Email });

  return {
    operation: "Query",
    query: {
      expression,
      expressionValues,
    },
    index: "EmailIndex",
  };
}

export function response(ctx) {
    if (ctx.error) {
      util.error(ctx.error.message, ctx.error.type);
      return null;
    }
  
    const item = ctx.result.items[0];
  
    if (!item) {
      return null;
    }
  
    const { PK, SK } = item;
  
    if (!PK || !SK) {
      console.error(`PK or SK is null or undefined for item: ${JSON.stringify(item)}`);
      return null;
    }
  
    return item;
  }
  
