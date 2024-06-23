import { Mutation } from "./mutations";
import { Query } from "./queries";
import { GraphQLDateTime } from "graphql-scalars";

const resolvers = {
  AWSDateTime: GraphQLDateTime,
  Mutation,
  Query,
};

export default resolvers;
