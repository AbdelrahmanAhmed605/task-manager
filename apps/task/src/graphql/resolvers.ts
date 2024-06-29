import { Mutation } from "./mutations";
import { Query } from "./queries";
import { GraphQLDateTime, GraphQLDate } from "graphql-scalars";

const resolvers = {
  AWSDateTime: GraphQLDateTime,
  AWSDate: GraphQLDate,
  Mutation,
  Query,
};

export default resolvers;
