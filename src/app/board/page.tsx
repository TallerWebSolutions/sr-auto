"use client";

import { gql, useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import { DemandCard } from "@/components/ui/DemandCard";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Add style for rotated text
const styles = {
  rotate270: {
    transform: "rotate(270deg)",
    transformOrigin: "center",
    whiteSpace: "nowrap",
    marginTop: "50px",
    marginBottom: "50px",
    textAlign: "center" as const
  }
};

interface BoardDemand {
  id: string;
  slug: string;
  demand_title: string;
  commitment_date: string | null;
  discarded_at: string | null;
  end_date: string | null;
  work_item_type_id: number | null;
  status: string;
  stage: {
    name: string;
  } | null;
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
    stage: {
      name: string;
    } | null;
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
      stage {
        name
      }
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
    "Upstream": [],
    "Options": [],
    "Downstream": [],
    "Concluídas": [],
    "Descartado": []
  });
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [minimizedColumns, setMinimizedColumns] = useState<string[]>([]);

  const toggleColumnMinimized = (columnName: string) => {
    setMinimizedColumns(prev => 
      prev.includes(columnName) 
        ? prev.filter(col => col !== columnName) 
        : [...prev, columnName]
    );
  };
  
  const isColumnMinimized = (columnName: string) => {
    return minimizedColumns.includes(columnName);
  };

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
      "Upstream": [],
      "Options": [],
      "Downstream": [],
      "Concluídas": [],
      "Descartado": []
    };

    demands.forEach(demand => {
      const stageName = demand.stage?.name || "";
      const boardDemand: BoardDemand = {
        ...demand,
        status: getDemandStatus(demand)
      };

      if (demand.discarded_at) {
        result["Descartado"].push(boardDemand);
      } else if (stageName === "Backlog") {
        result["Backlog"].push(boardDemand);
      } else if (["Waiting to Synthesis", "Synthesis", "In Analysis", "Ready to Analysis"].includes(stageName)) {
        result["Upstream"].push(boardDemand);
      } else if (stageName === "Options Inventory") {
        result["Options"].push(boardDemand);
      } else if (["Ready to Dev", "Developing", "Ready to HMG", "Homologating", "Ready to Deploy"].includes(stageName)) {
        result["Downstream"].push(boardDemand);
      } else if (["Done", "Arquivado"].includes(stageName)) {
        result["Concluídas"].push(boardDemand);
      } else {
        // Fallback to the existing categorization logic if stage name doesn't match
        if (demand.end_date) {
          result["Concluídas"].push(boardDemand);
        } else if (demand.commitment_date) {
          result["Downstream"].push(boardDemand);
        } else {
          result["Backlog"].push(boardDemand);
        }
      }
    });

    return result;
  };

  const getDemandStatus = (demand: BoardResponse['demands'][0]): string => {
    if (demand.discarded_at) return "Descartado";
    
    const stageName = demand.stage?.name || "";
    
    if (["Done", "Arquivado"].includes(stageName)) return "Concluídas";
    if (["Ready to Dev", "Developing", "Ready to HMG", "Homologating", "Ready to Deploy"].includes(stageName)) return "Downstream";
    if (stageName === "Options Inventory") return "Options";
    if (["Waiting to Synthesis", "Synthesis", "In Analysis", "Ready to Analysis"].includes(stageName)) return "Upstream";
    if (stageName === "Backlog") return "Backlog";
    
    // Fallback to the original logic
    if (demand.end_date) return "Concluídas";
    if (demand.commitment_date) return "Downstream";
    
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

  const renderColumn = (columnName: string, demands: BoardDemand[]) => {
    const isMinimized = isColumnMinimized(columnName);
    
    if (isMinimized) {
      return (
        <div className="bg-gray-100 p-2 rounded-lg flex flex-col items-center justify-between" style={{ width: '40px', minHeight: '300px' }}>
          <button 
            onClick={() => toggleColumnMinimized(columnName)}
            className="mb-2 p-1 rounded-full hover:bg-gray-200 mt-2"
            title={`Expandir ${columnName}`}
          >
            <ChevronRight size={18} />
          </button>
          
          <div className="flex-grow flex flex-col justify-center">
            <div style={styles.rotate270} className="font-semibold text-xs">{columnName}</div>
          </div>
          
          <div className="mb-2 mt-auto font-semibold text-xs">({demands.length})</div>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-100 p-4 rounded-lg flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-center flex-1">{columnName} ({demands.length})</h2>
          <button 
            onClick={() => toggleColumnMinimized(columnName)}
            className="p-1 rounded-full hover:bg-gray-200"
            title={`Minimizar ${columnName}`}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <div className="space-y-4">
          {columnName === "Concluídas" ? (
            <>
              {demands
                .filter(demand => {
                  if (showAllCompleted) return true;
                  if (!demand.end_date) return false;
                  const twoWeeksAgo = new Date();
                  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                  return new Date(demand.end_date) >= twoWeeksAgo;
                })
                .map(demand => (
                  <DemandCard 
                    key={demand.id}
                    demand={demand}
                  />
                ))
              }
              {!showAllCompleted && demands.some(demand => {
                if (!demand.end_date) return false;
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                return new Date(demand.end_date) < twoWeeksAgo;
              }) && (
                <button 
                  className="w-full p-2 mt-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  onClick={() => setShowAllCompleted(true)}
                >
                  Mostrar todas as concluídas
                </button>
              )}
              {showAllCompleted && (
                <button 
                  className="w-full p-2 mt-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  onClick={() => setShowAllCompleted(false)}
                >
                  Mostrar apenas recentes
                </button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Board de Demandas: {data?.customers_by_pk?.name || 'Cliente'}
        </h1>
        {isCustomerIdEmpty && <ParameterSelectionButtons parameterName="customer_id" />}
      </div>
      
      <div className="flex gap-4 mb-8 items-stretch">
        {Object.entries(groupedDemands)
          .filter(([status]) => status !== "Descartado")
          .map(([columnName, demands]) => (
            <div key={columnName} className={isColumnMinimized(columnName) ? "" : "flex-1"}>
              {renderColumn(columnName, demands)}
            </div>
          ))}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Descartado ({groupedDemands["Descartado"].length})</h2>
        <div className="grid grid-cols-3 gap-4">
          {groupedDemands["Descartado"].map(demand => (
            <DemandCard 
              key={demand.id}
              demand={demand}
            />
          ))}
          {groupedDemands["Descartado"].length === 0 && (
            <div className="text-center p-4 text-gray-500">
              Nenhuma demanda descartada
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 