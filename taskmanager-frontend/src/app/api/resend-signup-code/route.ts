import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextRequest, NextResponse } from "next/server";

const client = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: email,
  };

  try {
    const result = await client.send(new ResendConfirmationCodeCommand(params));
    console.log("Resend confirmation code response:", result);
    return new NextResponse(
      JSON.stringify({
        message: "Please check your email for a new verification code.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Resend code error:", error);
    let friendlyMessage =
      "We couldn't resend the verification code. Please try again later.";

    if (error.name === "LimitExceededException") {
      friendlyMessage =
        "You've reached the limit for sending verification codes. Please wait before trying again.";
    } else if (error.name === "UserNotFoundException") {
      friendlyMessage = "No account found with that email address.";
    } else if (error.name === "NotAuthorizedException") {
      friendlyMessage =
        "Your request cannot be processed. Please contact support if this continues.";
    }

    return new NextResponse(JSON.stringify({ message: friendlyMessage }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
