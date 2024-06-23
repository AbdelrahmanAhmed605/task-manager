import express from "express";
import { ApolloServer, AuthenticationError } from "apollo-server-express";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import resolvers from "./graphql/resolvers";
import { typeDefs } from "./graphql/TypeDefs";
import CognitoExpress from "./auth/authMiddleware";

// Load environment variables
dotenv.config();

async function startServer() {
  // Configure AWS SDK
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const cognitoExpress = new CognitoExpress({
    region: process.env.AWS_REGION,
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    tokenUse: "access",
    tokenExpiration: Number(process.env.AWS_COGNITO_TOKEN_EXPIRATION),
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      let accessTokenFromClient = req.headers.accesstoken;
      if (typeof accessTokenFromClient === "string") {
        try {
          const response = await cognitoExpress.validate(accessTokenFromClient);
          return { user: response };
        } catch (e) {
          console.error(e);
          throw new AuthenticationError("Unauthorized");
        }
      } else {
        throw new AuthenticationError("Access token is missing or invalid");
      }
    },
  });

  const app = express();
  app.use(bodyParser.json());
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const port = process.env.PORT || 3333;
  const url = process.env.URL || "http://localhost";
  const server = app.listen(port, () => {
    console.log(`Listening at ${url}:${port}/graphql`);
  });
  server.on("error", console.error);
}

startServer();
