"use client";

import { gql, useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import { DemandCard } from "@/components/ui/DemandCard";
import { useState, useEffect } from "react";

interface BoardDemand {
  id: string;
  slug: string;
  demand_title: string;
  commitment_date: string | null;
  discarded_at: string | null;
  end_date: string | null;
  work_item_type_id: number | null;
  status: string;
}

interface BoardResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
    work_item_type_id: number | null;
  }[];
  customers_by_pk?: {
    name: string;
  };
}

const BOARD_DEMANDS_QUERY = (customerId: string | null) => gql`
  query BoardDemandsQuery {
    demands(where: {customer_id: {_eq: ${customerId}}}) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
      work_item_type_id
    }
    customers_by_pk(
      id: ${customerId}
    ) {
      name
    }
  }
`;

export default function BoardPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id') || "0";
  const isCustomerIdEmpty = !customerId || customerId === "0";
  const [groupedDemands, setGroupedDemands] = useState<Record<string, BoardDemand[]>>({
    "Backlog": [],
    "Em Andamento": [],
    "Concluído": [],
    "Descartado": []
  });

  const { loading, error, data } = useQuery<BoardResponse>(BOARD_DEMANDS_QUERY(customerId), {
    fetchPolicy: "network-only",
    skip: isCustomerIdEmpty
  });

  useEffect(() => {
    if (data?.demands) {
      const categorizedDemands = categorizeDemands(data.demands);
      setGroupedDemands(categorizedDemands);
    }
  }, [data]);

  const categorizeDemands = (demands: BoardResponse['demands']) => {
    const result: Record<string, BoardDemand[]> = {
      "Backlog": [],
      "Em Andamento": [],
      "Concluído": [],
      "Descartado": []
    };

    demands.forEach(demand => {
      const boardDemand: BoardDemand = {
        ...demand,
        status: getDemandStatus(demand)
      };

      if (demand.discarded_at) {
        result["Descartado"].push(boardDemand);
      } else if (demand.end_date) {
        result["Concluído"].push(boardDemand);
      } else if (demand.commitment_date) {
        result["Em Andamento"].push(boardDemand);
      } else {
        result["Backlog"].push(boardDemand);
      }
    });

    return result;
  };

  const getDemandStatus = (demand: BoardResponse['demands'][0]): string => {
    if (demand.discarded_at) return "Descartado";
    if (demand.end_date) return "Concluído";
    if (demand.commitment_date) return "Em Andamento";
    return "Backlog";
  };

  if (isCustomerIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Board de Demandas</h1>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Selecione um Cliente</h2>
          <p className="mb-4">Selecione um cliente para visualizar suas demandas no board.</p>
          <ParameterSelectionButtons parameterName="customer_id" />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Board de Demandas</h1>
        <div className="text-center p-8">Carregando...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Board de Demandas</h1>
        <div className="bg-red-100 p-4 rounded-lg mb-8">
          <p className="text-red-700">Erro ao carregar demandas: {error.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Board de Demandas: {data?.customers_by_pk?.name || 'Cliente'}
        </h1>
        {isCustomerIdEmpty && <ParameterSelectionButtons parameterName="customer_id" />}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(groupedDemands).map(([status, demands]) => (
          <div key={status} className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">{status} ({demands.length})</h2>
            <div className="space-y-4">
              {demands.map(demand => (
                <DemandCard 
                  key={demand.id}
                  demand={demand}
                />
              ))}
              {demands.length === 0 && (
                <div className="text-center p-4 text-gray-500">
                  Nenhuma demanda
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 