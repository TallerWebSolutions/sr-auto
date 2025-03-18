'use client'

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Badge } from "./badge";

const GET_PORTFOLIO_UNITS = gql`
  query PortfolioUnits {
    portfolio_units(where: {product_id: {_eq: 370}}) {
      name
      id
      portfolio_unit_type
    }
  }
`;

interface PortfolioUnit {
  name: string;
  portfolio_unit_type: number;
  id: number;
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

export function PortfolioUnitsTable() {
  const { data, loading, error } = useQuery(GET_PORTFOLIO_UNITS);

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
          {filteredUnits.map((unit) => (
            <tr key={unit.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{unit.name}</td>
              <td className="px-4 py-3">
                <Badge 
                  variant={portfolioUnitTypeMap[unit.portfolio_unit_type]?.variant || "secondary"}
                >
                  {portfolioUnitTypeMap[unit.portfolio_unit_type]?.label || unit.portfolio_unit_type}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-right">-</td>
              <td className="px-4 py-3 text-sm text-right">-</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 