import { NextApiHandler } from "next";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: "us-east-1", // Specify your Cognito region
});

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Cognito",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      authorize: async (credentials) => {
        if (
          !credentials ||
          typeof credentials.username !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const { username, password } = credentials;
        const command = new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: process.env.COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
        });

        try {
          const { AuthenticationResult } = await cognitoClient.send(command);
          if (AuthenticationResult) {
            return {
              id: username,
              name: username,
              email: username,
              accessToken: AuthenticationResult.AccessToken,
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      return {
        ...token,
        ...user,
      };
    },
    session: async ({ session, token }) => {
      session.user = {
        name: token.name || session.user?.name || null,
        email: token.email || session.user?.email || null,
      };
      session.accessToken = (token.accessToken as string) ?? null;

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};

export const GET: NextApiHandler = (req, res) =>
  NextAuth(req, res, authOptions);
export const POST: NextApiHandler = (req, res) =>
  NextAuth(req, res, authOptions);
