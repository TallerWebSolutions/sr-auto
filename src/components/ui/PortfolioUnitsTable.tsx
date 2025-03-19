'use client'

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Badge } from "./badge";

const GET_PORTFOLIO_UNITS = gql`
  query PortfolioUnits($productId: Int!) {
    portfolio_units(where: {product_id: {_eq: $productId}}) {
      name
      id
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

interface PortfolioUnit {
  name: string;
  portfolio_unit_type: number;
  id: number;
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

interface PortfolioUnitsTableProps {
  productId: number;
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

export function PortfolioUnitsTable({ productId }: PortfolioUnitsTableProps) {
  const { data, loading, error } = useQuery(GET_PORTFOLIO_UNITS, {
    variables: { productId }
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

  const units: PortfolioUnit[] = data?.portfolio_units || [];
  const filteredUnits = units.filter(unit => unit.portfolio_unit_type === 4);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-500">Nome</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Custo Total</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Horas Totais</th>
          </tr>
        </thead>
        <tbody>
          {filteredUnits.map((unit) => {
            const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
            const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
            const totalHours = upstreamHours + downstreamHours;
            const totalCost = unit.demands_aggregate.aggregate.sum.cost_to_project || 0;
            
            return (
              <tr key={unit.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{unit.name}</td>
                <td className="px-4 py-3">
                  <Badge 
                    variant={portfolioUnitTypeMap[unit.portfolio_unit_type]?.variant || "secondary"}
                  >
                    {portfolioUnitTypeMap[unit.portfolio_unit_type]?.label || unit.portfolio_unit_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-right">{totalCost > 0 ? `R$ ${totalCost.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3 text-sm text-right">{totalHours > 0 ? totalHours.toFixed(2) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 