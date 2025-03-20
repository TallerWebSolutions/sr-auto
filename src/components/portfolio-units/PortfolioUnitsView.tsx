'use client'

import { useState } from "react"
import { PortfolioUnitsBoard } from "./PortfolioUnitsBoard"
import { PortfolioUnitsList } from "./PortfolioUnitsList"
import { PortfolioUnitsBarChart } from "./PortfolioUnitsBarChart"
import { ToggleGroup, ToggleButton } from "../ui/toggle-group"
import { Layout, Table } from "lucide-react"
import { useQuery } from "@apollo/client"
import { gql } from "@apollo/client"

const GET_PORTFOLIO_UNITS = gql`
  query PortfolioUnits($productId: Int!, $orderBy: [portfolio_units_order_by!], $portfolioUnitType: Int) {
    portfolio_units(
      where: {
        product_id: {_eq: $productId}, 
        portfolio_unit_type: {_eq: $portfolioUnitType}
      }, 
      order_by: $orderBy
    ) {
      name
      id
      parent_id
      portfolio_unit_type
      demands_aggregate {
        aggregate {
          sum {
            effort_downstream
            effort_upstream
            cost_to_project
          }
        }
      }
    }
  }
`;

export interface PortfolioUnit {
  name: string;
  id: number;
  parent_id: number | null;
  portfolio_unit_type: number;
  demands_aggregate: {
    aggregate: {
      sum: {
        effort_downstream: number | null;
        effort_upstream: number | null;
        cost_to_project: number | null;
      }
    }
  }
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

interface PortfolioUnitsViewProps {
  productId: number;
}

export function PortfolioUnitsView({ productId }: PortfolioUnitsViewProps) {
  const [viewMode, setViewMode] = useState<string>("list")
  const [portfolioUnitType, setPortfolioUnitType] = useState<number>(4)
  const [sorting, setSorting] = useState<{ field: 'hours' | 'name', direction: 'asc' | 'desc' }>({
    field: 'hours',
    direction: 'asc'
  });

  const getOrderBy = () => {
    if (sorting.field === 'name') {
      return [{ name: sorting.direction }];
    }
    return [{}];
  };

  const { data, loading, error } = useQuery(GET_PORTFOLIO_UNITS, {
    variables: { 
      productId,
      orderBy: getOrderBy(),
      portfolioUnitType
    }
  });

  const units: PortfolioUnit[] = data?.portfolio_units || [];

  const containerClassName = viewMode === "list" 
    ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
    : "grid grid-cols-1 gap-6";

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Unidades de Portfolio</h1>
        <div className="flex gap-4 items-center">
          <select
            className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={portfolioUnitType}
            onChange={(e) => setPortfolioUnitType(parseInt(e.target.value))}
          >
            {Object.entries(portfolioUnitTypeMap).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={setViewMode}
          >
            <ToggleButton value="list" aria-label="Visualização de tabela">
              <Table className="h-4 w-4 mr-2" />
              Lista
            </ToggleButton>
            <ToggleButton value="board" aria-label="Visualização de quadro">
              <Layout className="h-4 w-4 mr-2" />
              Quadro
            </ToggleButton>
          </ToggleGroup>
        </div>
      </div>
      
      <div className={containerClassName}>
        <div className="rounded-lg border p-6">
          {viewMode === "list" ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Lista de Unidades</h2>
              <PortfolioUnitsList 
                units={units} 
                loading={loading} 
                error={error}
                sorting={sorting}
                onSortChange={setSorting}
              />
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Quadro de Unidades</h2>
              <PortfolioUnitsBoard 
                units={units}
                loading={loading}
                error={error}
              />
            </>
          )}
        </div>
        
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Gráfico de Horas por Unidade</h2>
          <PortfolioUnitsBarChart
            units={units}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  )
} 