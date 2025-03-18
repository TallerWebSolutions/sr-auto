"use client";

import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
import { DemandCard } from "@/components/ui/DemandCard";
import { WorkItemTypeChart } from "@/components/ui/WorkItemTypeChart";
import { useSearchParams } from "next/navigation";
import { EmptyStateParameterRequired } from "@/components/ui/EmptyStateParameterRequired";

interface DemandsResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
    work_item_type_id: number | null;
  }[];
  projects_by_pk?: {
    name: string;
  };
}

const DEMANDS_QUERY = (projectId: string | null) => gql`
  query DemandsQuery {
    demands(where: {project_id: {_eq: ${projectId}}}) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
      work_item_type_id
    }
    projects_by_pk(
      id: ${projectId}
    ) {
      name
    }
  }
`;

export default function DemandsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || "0";
  const isProjectIdEmpty = !projectId || projectId === "0";

  const { loading, error, data } = useQuery<DemandsResponse>(DEMANDS_QUERY(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });

  if (isProjectIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Demandas</h1>
        </div>
        <EmptyStateParameterRequired parameterName="project_id" />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Demandas
            {data?.projects_by_pk?.name && (
              <span className="ml-2 text-blue-600">- {data.projects_by_pk.name}</span>
            )}
          </h1>
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
        <h1 className="mb-8 text-3xl font-bold">Demandas</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700">Erro ao carregar demandas</h2>
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

  const demands = data?.demands || [];

  const sortDemandsByStatus = (demands: DemandsResponse['demands']) => {
    return [...demands].sort((a, b) => {
      const getStatusPriority = (demand: typeof a) => {
        if (demand.discarded_at) return 4;
        if (!demand.commitment_date) return 3;
        if (demand.end_date) return 2;
        return 1;
      };

      const statusPriorityA = getStatusPriority(a);
      const statusPriorityB = getStatusPriority(b);

      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }

      if (statusPriorityA === 1) {
        return new Date(a.commitment_date!).getTime() - new Date(b.commitment_date!).getTime();
      }

      if (statusPriorityA === 2) {
        return new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime();
      }

      if (statusPriorityA === 4) {
        return new Date(b.discarded_at!).getTime() - new Date(a.discarded_at!).getTime();
      }

      return 0;
    });
  };

  const sortedDemands = sortDemandsByStatus(demands);

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Demandas
          {data?.projects_by_pk?.name && (
            <span className="ml-2 text-blue-600">- {data.projects_by_pk.name}</span>
          )}
        </h1>
        <div className="text-gray-500">
          Total: <span className="font-semibold">{demands.length}</span>
        </div>
      </div>
      
      {demands.length > 0 && <WorkItemTypeChart demands={demands} />}
      
      {demands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDemands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda encontrada</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas para este projeto.
          </p>
        </div>
      )}
    </main>
  );
} 