"use client";

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";

// Usando variáveis de ambiente para configuração do GraphQL
const GRAPHQL_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL || 'https://ace-gannet-55.hasura.app/v1/graphql';
const HASURA_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || '';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": HASURA_SECRET,
  },
});

const client = new ApolloClient({
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

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
