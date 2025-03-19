'use client'

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Badge } from "../ui/badge";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

const GET_PORTFOLIO_UNITS = gql`
  query PortfolioUnits($productId: Int!, $orderBy: [portfolio_units_order_by!]) {
    portfolio_units(
      where: {product_id: {_eq: $productId}}, 
      order_by: $orderBy
    ) {
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

interface PortfolioUnitsListProps {
  productId: number;
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

export function PortfolioUnitsList({ productId }: PortfolioUnitsListProps) {
  const [sorting, setSorting] = useState<{ field: 'hours' | 'name', direction: 'asc' | 'desc' }>({
    field: 'hours',
    direction: 'desc'
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
      orderBy: getOrderBy()
    }
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

  const units: PortfolioUnit[] = data?.portfolio_units || [];
  const filteredUnits = units.filter(unit => unit.portfolio_unit_type === 4);

  const getTotalHours = (unit: PortfolioUnit): number => {
    const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
    const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
    return upstreamHours + downstreamHours;
  };

  const sortedUnits = [...filteredUnits].sort((a, b) => {
    if (sorting.field === 'hours') {
      const multiplier = sorting.direction === 'desc' ? -1 : 1;
      return (getTotalHours(b) - getTotalHours(a)) * multiplier;
    }
    return 0;
  });

  const toggleSort = (field: 'hours' | 'name') => {
    setSorting(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th 
              className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2"
              onClick={() => toggleSort('name')}
            >
              Nome
              <ArrowUpDown className="h-4 w-4" />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Custo Total</th>
            <th 
              className="px-4 py-3 text-right font-medium text-gray-500 cursor-pointer hover:text-gray-700 flex items-center justify-end gap-2"
              onClick={() => toggleSort('hours')}
            >
              Horas Totais
              <ArrowUpDown className="h-4 w-4" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUnits.map((unit) => {
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