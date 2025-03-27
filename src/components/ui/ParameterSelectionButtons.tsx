"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";
import { gql, useQuery, DocumentNode } from "@apollo/client";
import Link from "next/link";

interface ParameterSelectionButtonsProps {
  parameterName: string;
}

const GET_PROJECTS = gql`
  query GetProjects {
    projects(where: { status: { _eq: 1 } }) {
      id
      name
      status
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      contracts(
        where: {
          _and: [
            { start_date: { _lte: "now()" } }
            {
              _or: [
                { end_date: { _gte: "now()" } }
                { end_date: { _is_null: true } }
              ]
            }
          ]
        }
      ) {
        id
        start_date
        end_date
      }
    }
  }
`;

const GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS = gql`
  query GetCustomersWithActiveContracts {
    customers {
      id
      name
      contracts(
        where: {
          _and: [
            { start_date: { _lte: "now()" } }
            {
              _or: [
                { end_date: { _gte: "now()" } }
                { end_date: { _is_null: true } }
              ]
            }
          ]
        }
      ) {
        id
        start_date
        end_date
      }
    }
  }
`;

const GET_CONTRACTS = gql`
  query GetContracts {
    contracts(
      where: {
        _and: [
          { start_date: { _lte: "now()" } }
          {
            _or: [
              { end_date: { _gte: "now()" } }
              { end_date: { _is_null: true } }
            ]
          }
        ]
      }
      order_by: { end_date: asc }
    ) {
      id
      product {
        name
      }
      start_date
      end_date
    }
  }
`;

interface OptionItem {
  id: number;
  name: string;
  status?: number;
  product?: {
    name: string;
  };
  start_date?: string;
  end_date?: string;
  contracts?: Array<{
    id: number;
    start_date: string;
    end_date: string | null;
  }>;
}

export function ParameterSelectionButtons({
  parameterName,
}: ParameterSelectionButtonsProps) {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const pathname = usePathname();

  const queryMap: Record<string, DocumentNode> = {
    project_id: GET_PROJECTS,
    product_id: GET_PRODUCTS,
    customer_id: GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS,
    contract_id: GET_CONTRACTS,
  };

  const query = queryMap[parameterName] || GET_PROJECTS;

  const { loading, error, data } = useQuery(query, {
    skip: !query,
  });

  useEffect(() => {
    if (!data) return;

    interface QueryResult {
      projects?: OptionItem[];
      products?: OptionItem[];
      customers?: OptionItem[];
      contracts?: OptionItem[];
    }

    const dataProcessors: Record<string, (data: QueryResult) => OptionItem[]> = {
      project_id: (data) => data.projects || [],
      product_id: (data) => 
        (data.products || []).filter(
          (product: OptionItem) => 
            product.contracts && product.contracts.length > 0
        ),
      customer_id: (data) => 
        (data.customers || []).filter(
          (customer: OptionItem) => 
            customer.contracts && customer.contracts.length > 0
        ),
      contract_id: (data) => data.contracts || [],
    };

    const processor = dataProcessors[parameterName];
    if (processor) {
      setOptions(processor(data));
    }
  }, [data, parameterName]);

  const generateUrl = (id: number) => `${pathname}?${parameterName}=${id}`;

  const parameterTitles: Record<string, string> = {
    project_id: "Projeto em Execução",
    product_id: "Produto com Contrato Ativo",
    customer_id: "Cliente com Contrato Ativo",
    contract_id: "Contrato Ativo",
  };

  const getParameterTitle = () => parameterTitles[parameterName] || "Opções";

  const formatItemLabel = (item: OptionItem) => {
    if (parameterName === "contract_id" && item.start_date) {
      const endDateText = item.end_date 
        ? `até ${new Date(item.end_date).toLocaleDateString("pt-BR")}`
        : "Sem data de término";
      
      return `${item.product?.name || ""} (${endDateText})`;
    } 
    
    if (parameterName === "customer_id" && item.contracts) {
      const activeContractsCount = item.contracts.length;
      return `${item.name} (${activeContractsCount} contrato${
        activeContractsCount !== 1 ? "s" : ""
      } ativo${activeContractsCount !== 1 ? "s" : ""})`;
    } 
    
    if (parameterName === "project_id") {
      return `${item.name} (Em Execução)`;
    } 
    
    if (parameterName === "product_id" && item.contracts) {
      const activeContractsCount = item.contracts.length;
      return `${item.name} (${activeContractsCount} contrato${
        activeContractsCount !== 1 ? "s" : ""
      } ativo${activeContractsCount !== 1 ? "s" : ""})`;
    }
    
    return item.name;
  };

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
      <div className="rounded-full bg-amber-100 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Parâmetro Requerido</h3>
      <p className="text-gray-500 mb-4 max-w-md">
        É necessário fornecer o parâmetro{" "}
        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
          {parameterName}
        </span>{" "}
        na URL para visualizar este conteúdo.
      </p>

      {loading ? (
        <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
          <p className="text-sm text-gray-500 mb-2">Carregando opções...</p>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gray-100 h-10 rounded animate-pulse"
            ></div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 mt-4">
          Erro ao carregar opções: {error.message}
        </p>
      ) : options.length > 0 ? (
        <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
          <p className="text-sm text-gray-500 mb-2">
            Selecione um {getParameterTitle()}:
          </p>
          {options.map((item) => (
            <Link
              key={item.id}
              href={generateUrl(item.id)}
              className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
            >
              {formatItemLabel(item)}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
          <p className="text-gray-600">
            Nenhuma opção disponível para {getParameterTitle().toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
}
