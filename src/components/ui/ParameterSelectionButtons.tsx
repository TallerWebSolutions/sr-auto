'use client'

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { usePathname } from "next/navigation"
import { gql, useQuery, DocumentNode } from "@apollo/client"
import Link from "next/link"

interface ParameterSelectionButtonsProps {
  parameterName: string;
}

// Queries para buscar as opções dos parâmetros
const GET_PROJECTS = gql`
  query GetProjects {
    projects(where: {status: {_eq: 1}}) {
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
      contracts(where: {
        _and: [
          {start_date: {_lte: "now()"}},
          {_or: [
            {end_date: {_gte: "now()"}},
            {end_date: {_is_null: true}}
          ]}
        ]
      }) {
        id
        start_date
        end_date
      }
    }
  }
`;

// Query para buscar clientes com contratos ativos
const GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS = gql`
  query GetCustomersWithActiveContracts {
    customers {
      id
      name
      contracts(where: {
        _and: [
          {start_date: {_lte: "now()"}},
          {_or: [
            {end_date: {_gte: "now()"}},
            {end_date: {_is_null: true}}
          ]}
        ]
      }) {
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
          {start_date: {_lte: "now()"}},
          {_or: [
            {end_date: {_gte: "now()"}},
            {end_date: {_is_null: true}}
          ]}
        ]
      }
    ) {
      id
      customer {
        name
      }
      start_date
      end_date
    }
  }
`;

// Interface para as opções
interface OptionItem {
  id: number;
  name: string;
  status?: number;
  customer?: {
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

export function ParameterSelectionButtons({ parameterName }: ParameterSelectionButtonsProps) {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const pathname = usePathname();

  // Selecionar a query apropriada com base no nome do parâmetro
  let query: DocumentNode | null = null;
  if (parameterName === 'project_id') {
    query = GET_PROJECTS;
  } else if (parameterName === 'product_id') {
    query = GET_PRODUCTS;
  } else if (parameterName === 'customer_id') {
    query = GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS;
  } else if (parameterName === 'contract_id') {
    query = GET_CONTRACTS;
  }

  const { loading, error, data } = useQuery(query || GET_PROJECTS, {
    skip: !query
  });

  // Extrair opções dos dados retornados
  useEffect(() => {
    if (data) {
      if (parameterName === 'project_id' && data.projects) {
        setOptions(data.projects);
      } else if (parameterName === 'product_id' && data.products) {
        // Filtrar produtos para incluir apenas aqueles com contratos ativos
        const productsWithActiveContracts = data.products
          .filter((product: OptionItem) => product.contracts && product.contracts.length > 0);
        setOptions(productsWithActiveContracts);
      } else if (parameterName === 'customer_id' && data.customers) {
        // Filtrar clientes para incluir apenas aqueles com contratos ativos
        const customersWithActiveContracts = data.customers
          .filter((customer: OptionItem) => customer.contracts && customer.contracts.length > 0);
        setOptions(customersWithActiveContracts);
      } else if (parameterName === 'contract_id' && data.contracts) {
        setOptions(data.contracts);
      }
    }
  }, [data, parameterName]);

  // Gerar URL com o parâmetro selecionado
  const generateUrl = (id: number) => {
    return `${pathname}?${parameterName}=${id}`;
  };

  // Obter um título amigável para o tipo de parâmetro
  const getParameterTitle = () => {
    if (parameterName === 'project_id') {
      return 'Projetos em Execução';
    } else if (parameterName === 'product_id') {
      return 'Produtos com Contratos Ativos';
    } else if (parameterName === 'customer_id') {
      return 'Clientes com Contratos Ativos';
    } else if (parameterName === 'contract_id') {
      return 'Contratos Ativos';
    }
    return 'Opções';
  };

  // Formatar o label do item (específico para cada tipo)
  const formatItemLabel = (item: OptionItem) => {
    if (parameterName === 'contract_id' && item.start_date) {
      const startDate = new Date(item.start_date);
      const formattedDate = startDate.toLocaleDateString('pt-BR');
      let endDateText = 'Sem data de término';
      
      if (item.end_date) {
        const endDate = new Date(item.end_date);
        const endFormattedDate = endDate.toLocaleDateString('pt-BR');
        endDateText = `até ${endFormattedDate}`;
      }
      
      return `${item.customer?.name || ''} - ${formattedDate} (${endDateText}) - Ativo`;
    } else if (parameterName === 'customer_id' && item.contracts) {
      const activeContractsCount = item.contracts.length;
      return `${item.name} (${activeContractsCount} contrato${activeContractsCount !== 1 ? 's' : ''} ativo${activeContractsCount !== 1 ? 's' : ''})`;
    } else if (parameterName === 'project_id') {
      return `${item.name} (Em Execução)`;
    } else if (parameterName === 'product_id' && item.contracts) {
      const activeContractsCount = item.contracts.length;
      return `${item.name} (${activeContractsCount} contrato${activeContractsCount !== 1 ? 's' : ''} ativo${activeContractsCount !== 1 ? 's' : ''})`;
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
        É necessário fornecer o parâmetro <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{parameterName}</span> na URL para visualizar este conteúdo.
      </p>
      
      {loading ? (
        <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
          <p className="text-sm text-gray-500 mb-2">Carregando opções...</p>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 h-10 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 mt-4">Erro ao carregar opções: {error.message}</p>
      ) : options.length > 0 ? (
        <div className="flex flex-col gap-2 mt-4 w-full max-w-md">
          <p className="text-sm text-gray-500 mb-2">Selecione um {getParameterTitle()}:</p>
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
  )
} 