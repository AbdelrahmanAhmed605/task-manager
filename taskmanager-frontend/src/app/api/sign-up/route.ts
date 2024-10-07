import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextRequest, NextResponse } from "next/server";

const client = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new NextResponse(
      JSON.stringify({
        message: "Please ensure both email and password are provided.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  };

  try {
    const res = await client.send(new SignUpCommand(params));
    return new NextResponse(
      JSON.stringify({
        message:
          "Registration successful! Please verify your email to activate your account.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Sign-up error:", error);
    let message =
      "We encountered an issue creating your account. Please try again.";
    let statusCode = 500;

    if (error.name === "UsernameExistsException") {
      message =
        "This email is already registered. Please log in or use a different email.";
      statusCode = 400;
    }

    return new NextResponse(JSON.stringify({ message }), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
