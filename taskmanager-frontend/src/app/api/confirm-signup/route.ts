import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

const client = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

export async function POST(request: NextRequest) {
  const { email, password, code } = await request.json();

  const confirmCommand = new ConfirmSignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID!,
    ConfirmationCode: code,
    Username: email,
  });

  try {
    const confirmRes = await client.send(confirmCommand);

    const authCommand = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const { AuthenticationResult } = await client.send(authCommand);
    if (AuthenticationResult) {
      const { AccessToken, IdToken } = AuthenticationResult;

      const cookies = [
        serialize("AccessToken", AccessToken!, {
          httpOnly: true,
          secure: true,
          path: "/",
          maxAge: 3600,
        }),
        serialize("IdToken", IdToken!, {
          httpOnly: true,
          secure: true,
          path: "/",
          maxAge: 3600,
        }),
      ];

      return new NextResponse(
        JSON.stringify({
          message:
            "Registration successful! Your account is now active and ready to use.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookies.join(", "),
          },
        }
      );
    } else {
      return new NextResponse(
        JSON.stringify({
          message:
            "We couldn't log you in immediately after confirmation. Please sign in manually.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Confirmation error:", error);
    let message =
      "We encountered an issue confirming your signup. Please try confirming again.";
    let statusCode = 500;

    if (error.name === "CodeMismatchException") {
      message =
        "The confirmation code you entered is incorrect. Please check and try again.";
      statusCode = 400;
    } else if (error.name === "ExpiredCodeException") {
      message = "Your confirmation code has expired. Please request a new one.";
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
