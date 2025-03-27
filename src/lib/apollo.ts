import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";

const GRAPHQL_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL || 'https://ace-gannet-55.hasura.app/v1/graphql';
const HASURA_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || '';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": HASURA_SECRET,
  },
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
  },
});

export default apolloClient; 