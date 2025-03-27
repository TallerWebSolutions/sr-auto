import { gql } from "@apollo/client";
import apolloClient from "@/lib/apollo";

type ContractEffortsResponse = {
  demand_efforts_aggregate: {
    aggregate: {
      sum: {
        effort_value: number;
      };
    };
  };
  demands_aggregate: {
    aggregate: {
      count: number;
    };
  };
  contracts_by_pk: {
    total_hours: number;
    start_date: string;
    end_date: string;
  };
};

type ContractEffortsResult = {
  contract: {
    start_date: string;
    end_date: string;
    total_hours: number;
  };
  totalEffort: number;
  demandsCount: number;
};

const CONTRACT_EFFORTS_QUERY = gql`
  query ContractEfforts($contractId: bigint!, $contractIdInt: Int!) {
    demand_efforts_aggregate(where: {demand: {contract_id: {_eq: $contractIdInt}}}) {
      aggregate {
        sum {
          effort_value
        }
      }
    }
    demands_aggregate(where: {end_date: {_is_null: false}, _and: {contract_id: {_eq: $contractIdInt}}}) {
      aggregate {
        count
      }
    }
    contracts_by_pk(id: $contractId) {
      total_hours
      start_date
      end_date
    }
  }
`;

export async function getContractTotalEffort(contractId: number): Promise<ContractEffortsResult> {
  try {
    const { data } = await apolloClient.query<ContractEffortsResponse>({
      query: CONTRACT_EFFORTS_QUERY,
      variables: { 
        contractId,
        contractIdInt: Number(contractId)
      },
      fetchPolicy: "network-only",
    });
    
    return {
      contract: {
        start_date: data?.contracts_by_pk?.start_date ?? "",
        end_date: data?.contracts_by_pk?.end_date ?? "",
        total_hours: data?.contracts_by_pk?.total_hours ?? 0
      },
      totalEffort: data?.demand_efforts_aggregate?.aggregate?.sum?.effort_value ?? 0,
      demandsCount: data?.demands_aggregate?.aggregate?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching contract efforts:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    return {
      totalEffort: 0,
      demandsCount: 0,
      contract: {
        start_date: "",
        end_date: "",
        total_hours: 0
      }
    };
  }
} 