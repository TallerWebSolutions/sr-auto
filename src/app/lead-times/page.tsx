"use client";

import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface DemandsResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
  }[];
}

const DEMANDS_QUERY = gql`
  query MyQuery {
    demands(
      where: { project_id: { _eq: 2226 } }
      order_by: { end_date: desc }
    ) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
    }
  }
`;

interface DemandWithLeadTime {
  id: string;
  slug: string;
  demand_title: string;
  commitment_date: string;
  end_date: string;
  lead_time_days: number;
}

export default function LeadTimesPage() {
  const { loading, error, data } = useQuery<DemandsResponse>(DEMANDS_QUERY, {
    fetchPolicy: "network-only",
  });

  // Calculate lead times for valid demands
  const demandsWithLeadTimes: DemandWithLeadTime[] = [];
  
  if (data?.demands) {
    data.demands.forEach(demand => {
      // Skip demands that were discarded or don't have end_date or commitment_date
      if (
        demand.discarded_at !== null || 
        demand.end_date === null || 
        demand.commitment_date === null
      ) {
        return;
      }
      
      // Calculate lead time in days
      const endDate = new Date(demand.end_date);
      const commitmentDate = new Date(demand.commitment_date);
      const diffTime = Math.abs(endDate.getTime() - commitmentDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24); // Remove Math.ceil to keep decimal places
      
      demandsWithLeadTimes.push({
        id: demand.id,
        slug: demand.slug,
        demand_title: demand.demand_title,
        commitment_date: demand.commitment_date,
        end_date: demand.end_date,
        lead_time_days: diffDays
      });
    });
  }
  
  // No need to sort here as the data is already sorted by the GraphQL query

  // Function to format date as dd/MMM/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get month in Portuguese
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[date.getMonth()];
    
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Lead Times de Demandas</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mt-3"></div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="mb-8 text-3xl font-bold">Lead Times de Demandas</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700">Erro ao carregar dados</h2>
          </div>
          <div className="text-red-500 bg-red-100 p-3 rounded">
            {error.message}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  // Calculate P80 (80th percentile) of lead times
  const calculateP80 = (values: number[]): string => {
    if (values.length === 0) return "0";
    
    // Sort the values in ascending order
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate the index for the 80th percentile
    const index = Math.ceil(sortedValues.length * 0.8) - 1;
    
    // Get the value at that index
    return sortedValues[index].toFixed(2);
  };
  
  // Get all lead time values
  const leadTimeValues = demandsWithLeadTimes.map(demand => demand.lead_time_days);
  
  // Calculate P80
  const p80LeadTime = calculateP80(leadTimeValues);

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Lead Times de Demandas</h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total válidas: <span className="font-semibold">{demandsWithLeadTimes.length}</span>
        </div>
      </div>
      
      {demandsWithLeadTimes.length > 0 ? (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <h2 className="text-lg font-semibold text-blue-800">Estatísticas de Lead Time</h2>
                <p className="text-blue-600">Baseado em {demandsWithLeadTimes.length} demandas concluídas</p>
              </div>
              <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-sm text-gray-500">P80 de Lead Time</span>
                <span className="text-2xl font-bold text-blue-700">{p80LeadTime} dias</span>
                <span className="text-xs text-gray-500 mt-1">80% das demandas abaixo deste valor</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demandsWithLeadTimes.map((demand) => (
              <Card key={demand.id} className="overflow-hidden transition-all duration-200 hover:shadow-md border-t-4 border-t-green-500">
                <div className="p-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">SLUG</div>
                    <div className="text-base font-bold break-words text-blue-700 uppercase">
                      {demand.slug || 
                        <span className="text-gray-400 italic">Sem slug</span>
                      }
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="text-sm font-medium text-gray-500 mb-2">Título</div>
                    <div className="text-lg font-semibold break-words">
                      {demand.demand_title || 
                        <span className="text-gray-400 italic">Sem título</span>
                      }
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Lead Time</div>
                        <div className="text-2xl font-bold text-green-600">{demand.lead_time_days.toFixed(2)} dias</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Início</div>
                        <div className="text-sm">{formatDate(demand.commitment_date)}</div>
                        <div className="text-xs text-gray-500 mt-1">Fim</div>
                        <div className="text-sm">{formatDate(demand.end_date)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda com lead time válido</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas com datas de início e fim válidas, ou todas foram descartadas.
          </p>
        </div>
      )}
    </main>
  );
} 