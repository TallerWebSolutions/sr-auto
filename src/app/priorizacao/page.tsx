"use client";

import { gql, useQuery } from "@apollo/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface PriorizacaoResponse {
  demands: Demand[];
  projects_by_pk?: {
    name: string;
  };
}

interface Demand {
  id: string;
  slug: string;
  demand_title: string;
  work_item_type_id: number | null;
  stage: {
    name: string;
  } | null;
  discarded_at: string | null;
  commitment_date: string | null;
}

interface DemandWithScores extends Demand {
  scores: {
    retencao: number;
    aquisicao: number;
    interacao: number;
    ftds: number;
    total: number;
  }
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

const StarRating = ({ value, onChange }: { value: number, onChange: (newValue: number) => void }) => {
  const handleClick = (rating: number) => {
    onChange(rating);
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleClick(star)}
          className="focus:outline-none"
        >
          <svg
            className={`h-5 w-5 ${star <= value ? 'text-yellow-500 fill-current' : 'text-gray-300 fill-current'}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
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

// ProjectSelectionWrapper component to handle automatic selection when there's only one project
function ProjectSelectionWrapper() {
  const { selectedCustomer } = useCustomerStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowSelector, setShouldShowSelector] = useState(false);

  // Custom query to get projects for the current customer
  const getProjectsQuery = gql`
    query GetProjects {
      projects(where: {products_projects: {product: {customer_id: {_eq: ${selectedCustomer?.id || null}}}, project: {status: {_eq: 1}}}}) {
        id
        name
        status
      }
    }
  `;

  const { loading, error, data } = useQuery(getProjectsQuery, {
    skip: !selectedCustomer?.id,
    fetchPolicy: "network-only"
  });

  useEffect(() => {
    if (loading || !data) return;

    const projects = data.projects || [];

    // If no projects, show selector with empty state
    if (projects.length === 0) {
      setIsLoading(false);
      setShouldShowSelector(true);
      return;
    }

    // If only one project, automatically select it
    if (projects.length === 1) {
      const projectId = projects[0].id;
      router.push(`${window.location.pathname}?project_id=${projectId}`);
      return;
    }

    // If multiple projects, show selector
    setIsLoading(false);
    setShouldShowSelector(true);
  }, [data, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Carregando projetos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Erro ao carregar projetos</h3>
        <p className="text-red-500 mb-4">{error.message}</p>
      </div>
    );
  }

  if (shouldShowSelector) {
    return <ParameterSelectionButtons parameterName="project_id" />;
  }

  return null;
}

export default function PriorizacaoPage() {
  const { selectedCustomer } = useCustomerStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project_id') || "0";
  const isProjectIdEmpty = !projectId || projectId === "0";

  // Store previous customer ID to detect changes
  const [previousCustomerId, setPreviousCustomerId] = useState<number | null>(null);

  // When customer changes, reset the URL to remove project_id
  useEffect(() => {
    // If this is the first render or if the customer ID hasn't changed, do nothing
    if (previousCustomerId === null) {
      setPreviousCustomerId(selectedCustomer?.id || null);
      return;
    }

    // If customer has changed and a project is selected, reset the URL
    if (previousCustomerId !== selectedCustomer?.id && !isProjectIdEmpty) {
      router.push(window.location.pathname);
    }

    // Update the previous customer ID
    setPreviousCustomerId(selectedCustomer?.id || null);
  }, [selectedCustomer, isProjectIdEmpty, previousCustomerId, router]);

  const { loading, error, data } = useQuery<PriorizacaoResponse>(PRIORIZACAO_QUERY(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });

  const [demandsWithScores, setDemandsWithScores] = useState<DemandWithScores[]>([]);
  const [displayDemands, setDisplayDemands] = useState<DemandWithScores[]>([]);
  const [isSorted, setIsSorted] = useState(false);

  if (isProjectIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <PageHeader title="Priorização" />
        <ProjectSelectionWrapper />
      </main>
    );
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const demands = data?.demands || [];
  const projectName = data?.projects_by_pk?.name;

  // Initialize scores if not already done
  if (demandsWithScores.length === 0 && demands.length > 0) {
    const initializedDemands = demands.map(demand => ({
      ...demand,
      scores: {
        retencao: 0,
        aquisicao: 0,
        interacao: 0,
        ftds: 0,
        total: 0
      }
    }));
    setDemandsWithScores(initializedDemands);
    setDisplayDemands(initializedDemands);
  }

  const filteredDemands = displayDemands.filter(demand => {
    const stageName = demand.stage?.name || "";
    return stageName === "Backlog" || UPSTREAM_STAGES.includes(stageName) || stageName === "Options Inventory";
  });

  const updateScore = (demandId: string, scoreType: 'retencao' | 'aquisicao' | 'interacao' | 'ftds', value: number) => {
    // Update the main data
    setDemandsWithScores(prevDemands => {
      return prevDemands.map(demand => {
        if (demand.id === demandId) {
          const updatedScores = {
            ...demand.scores,
            [scoreType]: value
          };
          
          // Calculate the total score based on weights from the image
          const total = 
            updatedScores.retencao * 20 + 
            updatedScores.aquisicao * 20 + 
            updatedScores.interacao * 20 + 
            updatedScores.ftds * 40;
          
          return {
            ...demand,
            scores: {
              ...updatedScores,
              total
            }
          };
        }
        return demand;
      });
    });

    // Also update the score in the display demands without changing order
    setDisplayDemands(prev => {
      return prev.map(demand => {
        if (demand.id === demandId) {
          const updatedScores = {
            ...demand.scores,
            [scoreType]: value
          };
          
          const total = 
            updatedScores.retencao * 20 + 
            updatedScores.aquisicao * 20 + 
            updatedScores.interacao * 20 + 
            updatedScores.ftds * 40;
          
          return {
            ...demand,
            scores: {
              ...updatedScores,
              total
            }
          };
        }
        return demand;
      });
    });
  };

  const handleSaveAndSort = () => {
    // Sort the display demands based on total score
    setDisplayDemands(prev => [...prev].sort((a, b) => b.scores.total - a.scores.total));
    setIsSorted(true);
  };

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

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Business Value Prioritization (BVP)</h2>
            <p className="text-sm text-blue-700">
              Avalie cada demanda atribuindo pontuações de 1 a 5 estrelas para cada critério. Os pesos são: 
              Retenção (20%), Aquisição (20%), Interação (20%), FTDs (40%).
            </p>
          </div>
          <button
            onClick={handleSaveAndSort}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isSorted ? "Reordenar" : "Salvar e Ordenar"}
          </button>
        </div>
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
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Aumenta a retenção</span>
                    <span className="text-xs font-normal">(20%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Aquisição de Usuários</span>
                    <span className="text-xs font-normal">(20%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Proporciona interação na comunidade</span>
                    <span className="text-xs font-normal">(20%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Produz mais FTDs</span>
                    <span className="text-xs font-normal">(40%)</span>
                  </div>
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-b">
                  <div className="flex flex-col items-center">
                    <span>Pontuação</span>
                    <span className="text-xs font-normal">(Total)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayDemands.map((demand) => (
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
                  <td className="p-3 border-b text-center">
                    <StarRating 
                      value={demand.scores.retencao} 
                      onChange={(value) => updateScore(demand.id, 'retencao', value)} 
                    />
                  </td>
                  <td className="p-3 border-b text-center">
                    <StarRating 
                      value={demand.scores.aquisicao} 
                      onChange={(value) => updateScore(demand.id, 'aquisicao', value)} 
                    />
                  </td>
                  <td className="p-3 border-b text-center">
                    <StarRating 
                      value={demand.scores.interacao} 
                      onChange={(value) => updateScore(demand.id, 'interacao', value)} 
                    />
                  </td>
                  <td className="p-3 border-b text-center">
                    <StarRating 
                      value={demand.scores.ftds} 
                      onChange={(value) => updateScore(demand.id, 'ftds', value)} 
                    />
                  </td>
                  <td className="p-3 border-b font-bold text-center">
                    {demand.scores.total}
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