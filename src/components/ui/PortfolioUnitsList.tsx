'use client'

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Badge } from "./badge";

const GET_PORTFOLIO_UNITS = gql`
  query PortfolioUnits {
    portfolio_units(where: {product_id: {_eq: 370}}) {
      name
      parent_id
      portfolio_unit_type
      id
    }
  }
`;

interface PortfolioUnit {
  name: string;
  parent_id: number | null;
  portfolio_unit_type: string;
  id: number;
}

interface GroupedUnits {
  [key: string]: PortfolioUnit[];
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

export function PortfolioUnitsList() {
  const { data, loading, error } = useQuery(GET_PORTFOLIO_UNITS);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

  const units: PortfolioUnit[] = data?.portfolio_units || [];
  const groupedUnits = units.reduce((acc: GroupedUnits, unit: PortfolioUnit) => {
    if (unit.parent_id) {
      if (!acc[unit.parent_id]) {
        acc[unit.parent_id] = [];
      }
      acc[unit.parent_id].push(unit);
    }
    return acc;
  }, {});

  const getUnitName = (id: number): string => {
    return units.find((unit: PortfolioUnit) => unit.id === id)?.name || '';
  };

  const sortedParentIds = Object.keys(groupedUnits).sort((a, b) => {
    const nameA = getUnitName(Number(a));
    const nameB = getUnitName(Number(b));
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="container mx-auto">
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {sortedParentIds.map((parentId) => (
            <div key={parentId} className="w-[280px] flex-shrink-0 flex flex-col bg-white rounded-lg border">
              <div className="p-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold truncate">
                  {getUnitName(Number(parentId))}
                </h3>
              </div>
              <div className="flex-1 overflow-x-scroll">
                <div className="h-auto">
                  <div className="space-y-2 p-3">
                    {groupedUnits[parentId].map((unit: PortfolioUnit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-medium truncate">{unit.name}</div>
                          <Badge 
                            variant={portfolioUnitTypeMap[unit.portfolio_unit_type]?.variant || "secondary"}
                          >
                            {portfolioUnitTypeMap[unit.portfolio_unit_type]?.label || unit.portfolio_unit_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 