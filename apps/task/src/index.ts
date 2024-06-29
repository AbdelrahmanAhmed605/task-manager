import express from "express";
import { ApolloServer, AuthenticationError } from "apollo-server-express";
import dotenv from "dotenv";
import resolvers from "./graphql/resolvers";
import { typeDefs } from "./graphql/TypeDefs";
import { CognitoExpress } from "utils";

// Load environment variables
dotenv.config();

async function startServer() {
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get("/api/tasks/health", (req, res) => {
    res.status(200).send("OK");
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/api/tasks/graphql" });

  const port = process.env.PORT || 3000;
  const url = process.env.URL || "http://localhost";
  const server = app.listen(port, () => {
    console.log(`Listening at ${url}:${port}/api/tasks/graphql`);
  });
  server.on("error", console.error);
}

startServer();
