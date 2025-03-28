import { gql } from "@apollo/client";
import apolloClient from "@/lib/apollo";
import { DemandEffort, ProjectAdditionalHour } from "@/components/hour-consumption/utils";

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
      products_projects: {
        project: {
          project_additional_hours: ProjectAdditionalHour[];
        };
      }[];
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
  finished_demands_efforts: {
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
  projectAdditionalHours: ProjectAdditionalHour[];
  totalEffort: number;
  demandsCount: number;
  finishedDemandsEffort: number;
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
        products_projects {
          project {
            project_additional_hours {
              hours
              event_date
            }
          }
        }
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
    finished_demands_efforts: demand_efforts_aggregate(
      where: { demand: { contract_id: { _eq: $contractIdInt }, end_date: { _is_null: false } } }
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

    const projectAdditionalHours: ProjectAdditionalHour[] = [];
    
    data?.contracts_by_pk?.product?.products_projects?.forEach(projectRelation => {
      if (projectRelation.project?.project_additional_hours) {
        projectAdditionalHours.push(...projectRelation.project.project_additional_hours);
      }
    });

    return {
      contract: {
        start_date: data?.contracts_by_pk?.start_date ?? "",
        end_date: data?.contracts_by_pk?.end_date ?? "",
        total_hours: data?.contracts_by_pk?.total_hours ?? 0,
      },
      product: {
        name: data?.contracts_by_pk?.product?.name ?? "",
      },
      demandEfforts: data?.demand_efforts ?? [],
      projectAdditionalHours,
      totalEffort:
        data?.demand_efforts_aggregate?.aggregate?.sum?.effort_value ?? 0,
      demandsCount:
        data?.contracts_by_pk?.demands_aggregate?.aggregate?.count ?? 0,
      finishedDemandsEffort:
        data?.finished_demands_efforts?.aggregate?.sum?.effort_value ?? 0,
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
      projectAdditionalHours: [],
      totalEffort: 0,
      demandsCount: 0,
      finishedDemandsEffort: 0,
    };
  }
}
