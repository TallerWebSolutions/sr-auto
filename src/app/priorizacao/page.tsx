"use client";

import { gql, useQuery } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import Link from "next/link";

interface PriorizacaoResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    work_item_type_id: number | null;
    stage: {
      name: string;
    } | null;
    discarded_at: string | null;
    commitment_date: string | null;
  }[];
  projects_by_pk?: {
    name: string;
  };
}

const workItemTypeConfig: Record<number, { name: string; color: string }> = {
  20: { name: 'Bug', color: '#F56565' },
  31: { name: 'Chore', color: '#ECC94B' },
  36: { name: 'Story', color: '#48BB78' },
  275: { name: 'Story', color: '#48BB78' },
};

const PRIORIZACAO_QUERY = (projectId: string | null) => gql`
  query PriorizacaoQuery {
    demands(where: {project_id: {_eq: ${projectId}}, discarded_at: {_is_null: true}, commitment_date: {_is_null: true}}) {
      id
      slug
      demand_title
      work_item_type_id
      stage {
        name
      }
      discarded_at
      commitment_date
    }
    projects_by_pk(
      id: ${projectId}
    ) {
      name
    }
  }
`;

const UPSTREAM_STAGES = ["Waiting to Synthesis", "Synthesis", "In Analysis", "Ready to Analysis"];

const PageHeader = ({ title, subtitle, count }: { title: string, subtitle?: string, count?: number }) => (
  <div className="flex items-center justify-between mb-8">
    <h1 className="text-3xl font-bold">
      {title}
      {subtitle && <span className="ml-2 text-blue-600">- {subtitle}</span>}
    </h1>
    {count !== undefined && (
      <div className="text-gray-500">
        Total: <span className="font-semibold">{count}</span>
      </div>
    )}
  </div>
);

const StageCard = ({ title, count }: { title: string; count: number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-sm text-gray-500 font-medium">
        {count} demandas
      </div>
    </CardContent>
  </Card>
);

const WorkItemType = ({ typeId }: { typeId: number | null }) => {
  if (!typeId) return <span className="text-gray-400 italic">-</span>;
  
  const config = workItemTypeConfig[typeId];
  if (!config) return <span className="text-gray-500">Tipo {typeId}</span>;
  
  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
      style={{ 
        backgroundColor: `${config.color}20`,
        color: config.color
      }}
    >
      {config.name}
    </span>
  );
};

const EmptyState = () => (
  <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h2 className="text-xl font-semibold mb-2">Nenhuma demanda encontrada</h2>
    <p className="text-gray-500">
      Não foram encontradas demandas nos estágios selecionados para este projeto.
    </p>
  </div>
);

const LoadingState = () => (
  <main className="container mx-auto p-4">
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold">Priorização</h1>
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
    </div>
  </main>
);

const ErrorState = ({ message }: { message: string }) => (
  <main className="container mx-auto p-4">
    <h1 className="mb-8 text-3xl font-bold">Priorização</h1>
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center mb-3">
        <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-red-700">Erro ao carregar demandas</h2>
      </div>
      <div className="text-red-500 bg-red-100 p-3 rounded">
        {message}
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

export default function PriorizacaoPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || "0";
  const isProjectIdEmpty = !projectId || projectId === "0";

  const { loading, error, data } = useQuery<PriorizacaoResponse>(PRIORIZACAO_QUERY(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });

  if (isProjectIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <PageHeader title="Priorização" />
        <ParameterSelectionButtons parameterName="project_id" />
      </main>
    );
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const demands = data?.demands || [];
  const projectName = data?.projects_by_pk?.name;

  const filteredDemands = demands.filter(demand => {
    const stageName = demand.stage?.name || "";
    return stageName === "Backlog" || UPSTREAM_STAGES.includes(stageName) || stageName === "Options Inventory";
  });

  const groupedDemands = {
    Backlog: filteredDemands.filter(d => d.stage?.name === "Backlog"),
    Upstream: filteredDemands.filter(d => UPSTREAM_STAGES.includes(d.stage?.name || "")),
    Options: filteredDemands.filter(d => d.stage?.name === "Options Inventory")
  };

  return (
    <main className="container mx-auto p-4">
      <PageHeader 
        title="Priorização" 
        subtitle={projectName} 
        count={filteredDemands.length} 
      />

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StageCard title="Backlog" count={groupedDemands.Backlog.length} />
        <StageCard title="Upstream" count={groupedDemands.Upstream.length} />
        <StageCard title="Options Inventory" count={groupedDemands.Options.length} />
      </div>

      {filteredDemands.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700 border-b">SLUG</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Título</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Tipo</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-b">Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemands.map((demand) => (
                <tr key={demand.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    {demand.slug ? (
                      <Link 
                        href={`https://tallerflow.atlassian.net/browse/${demand.slug}`}
                        target="_blank" 
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {demand.slug}
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                  <td className="p-3 border-b">
                    {demand.demand_title || <span className="text-gray-400 italic">Sem título</span>}
                  </td>
                  <td className="p-3 border-b">
                    <WorkItemType typeId={demand.work_item_type_id} />
                  </td>
                  <td className="p-3 border-b">
                    {demand.stage?.name || <span className="text-gray-400 italic">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState />
      )}
    </main>
  );
} 