export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDate: { input: string; output: string; }
  AWSDateTime: { input: string; output: string; }
  AWSEmail: { input: string; output: string; }
  AWSIPAddress: { input: string; output: string; }
  AWSJSON: { input: string; output: string; }
  AWSPhone: { input: string; output: string; }
  AWSTime: { input: string; output: string; }
  AWSTimestamp: { input: number; output: number; }
  AWSURL: { input: string; output: string; }
};

export type CreateUserInput = {
  Email: Scalars['AWSEmail']['input'];
  FirstName?: InputMaybe<Scalars['String']['input']>;
  LastName?: InputMaybe<Scalars['String']['input']>;
};

export type GraphQlError = {
  __typename?: 'GraphQLError';
  extensions?: Maybe<Scalars['AWSJSON']['output']>;
  message: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createUser?: Maybe<Response>;
  updateUser?: Maybe<Response>;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};

export type Query = {
  __typename?: 'Query';
  getUserByEmail?: Maybe<User>;
  getUserProfile?: Maybe<User>;
};


export type QueryGetUserByEmailArgs = {
  Email: Scalars['String']['input'];
};

export type Response = {
  __typename?: 'Response';
  errors?: Maybe<Array<Maybe<GraphQlError>>>;
  success: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

export type UpdateUserInput = {
  FirstName?: InputMaybe<Scalars['String']['input']>;
  LastName?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  CreatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
  Email: Scalars['AWSEmail']['output'];
  FirstName?: Maybe<Scalars['String']['output']>;
  LastLogin?: Maybe<Scalars['AWSDateTime']['output']>;
  LastName?: Maybe<Scalars['String']['output']>;
  PK: Scalars['String']['output'];
  SK: Scalars['String']['output'];
  UpdatedAt?: Maybe<Scalars['AWSDateTime']['output']>;
};
