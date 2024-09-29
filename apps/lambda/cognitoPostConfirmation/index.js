// index.js
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Check that this is a PostConfirmation trigger for ConfirmSignUp
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    // Extract user details from the event
    const { sub, email, given_name, family_name } =
      event.request.userAttributes;

    // Ensure required attributes are present
    if (!sub || !email) {
      console.error("User sub or email is missing in the event.");
      throw new Error("User attributes are missing");
    }

    // Check for DynamoDB table name
    if (!process.env.DYNAMODB_TABLE_NAME) {
      throw new Error("DynamoDB table name not set in environment variables");
    }

    // Prepare the item to add to DynamoDB
    const now = new Date().toISOString();
    const userItem = {
      PK: `USER#${sub}`,
      SK: `USER#${sub}`,
      Email: email,
      FirstName: given_name || null,
      LastName: family_name || null,
      CreatedAt: now,
      UpdatedAt: now,
      LastLogin: now,
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: userItem,
    };

    try {
      await dynamoDB.put(params).promise();
    } catch (error) {
      console.error(`Error adding USER#${sub} to DynamoDB: ${error.message}`);
      throw new Error("Error adding user to the database");
    }
  }

  return event;
};
