import { gql } from "@apollo/client";
import apolloClient from "@/lib/apollo";

type DemandEffort = {
  effort_value: number;
  start_time_to_computation: string;
};

type ContractEffortsResponse = {
  contracts_by_pk: {
    total_hours: number;
    start_date: string;
    end_date: string;
    demands_aggregate: {
      aggregate: {
        count: number;
      };
    };
    product: {
      name: string;
    };
  };
  demand_efforts: DemandEffort[];
  demand_efforts_aggregate: {
    aggregate: {
      sum: {
        effort_value: number;
      };
    };
  };
};

type ContractEffortsResult = {
  contract: {
    start_date: string;
    end_date: string;
    total_hours: number;
  };
  product: {
    name: string;
  };
  demandEfforts: DemandEffort[];
  totalEffort: number;
  demandsCount: number;
};

const CONTRACT_EFFORTS_QUERY = gql`
  query ContractEfforts($contractId: bigint!, $contractIdInt: Int!) {
    contracts_by_pk(id: $contractId) {
      total_hours
      start_date
      end_date
      demands_aggregate(where: { end_date: { _is_null: false } }) {
        aggregate {
          count
        }
      }
      product {
        name
      }
    }
    demand_efforts(
      where: { demand: { contract_id: { _eq: $contractIdInt } } }
    ) {
      effort_value
      start_time_to_computation
    }
    demand_efforts_aggregate(
      where: { demand: { contract_id: { _eq: $contractIdInt } } }
    ) {
      aggregate {
        sum {
          effort_value
        }
      }
    }
  }
`;

export async function getContractTotalEffort(
  contractId: number
): Promise<ContractEffortsResult> {
  try {
    const { data } = await apolloClient.query<ContractEffortsResponse>({
      query: CONTRACT_EFFORTS_QUERY,
      variables: {
        contractId,
        contractIdInt: Number(contractId),
      },
      fetchPolicy: "network-only",
    });

    return {
      contract: {
        start_date: data?.contracts_by_pk?.start_date ?? "",
        end_date: data?.contracts_by_pk?.end_date ?? "",
        total_hours: data?.contracts_by_pk?.total_hours ?? 0,
      },
      product: data?.contracts_by_pk?.product ?? "",
      demandEfforts: data?.demand_efforts ?? [],
      totalEffort:
        data?.demand_efforts_aggregate?.aggregate?.sum?.effort_value ?? 0,
      demandsCount:
        data?.contracts_by_pk?.demands_aggregate?.aggregate?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching contract efforts:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      contract: {
        start_date: "",
        end_date: "",
        total_hours: 0,
      },
      product: {
        name: "",
      },
      demandEfforts: [],
      totalEffort: 0,
      demandsCount: 0,
    };
  }
}
