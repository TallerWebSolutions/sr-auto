'use client'

import { Badge } from "../ui/badge";
import { PortfolioUnit } from "./PortfolioUnitsView";

interface PortfolioUnitsBoardProps {
  units: PortfolioUnit[];
  loading: boolean;
  error?: Error;
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

export function PortfolioUnitsBoard({ units, loading, error }: PortfolioUnitsBoardProps) {
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

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
          {sortedParentIds.map((parentId) => {
            const sortedUnits = [...groupedUnits[parentId]].sort((a, b) => a.name.localeCompare(b.name));
            
            return (
              <div key={parentId} className="w-[280px] flex-shrink-0 flex flex-col bg-white rounded-lg border">
                <div className="p-3 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold truncate">
                    {getUnitName(Number(parentId))}
                  </h3>
                </div>
                <div className="flex-1 overflow-x-scroll">
                  <div className="h-auto">
                    <div className="space-y-2 p-3">
                      {sortedUnits.map((unit: PortfolioUnit) => {
                        const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
                        const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
                        const totalHours = upstreamHours + downstreamHours;
                        const totalCost = unit.demands_aggregate.aggregate.sum.cost_to_project || 0;
                        
                        return (
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
                            <div className="flex flex-col items-end text-sm">
                              {totalHours > 0 && <span className="text-gray-600">{totalHours.toFixed(2)}h</span>}
                              {totalCost > 0 && <span className="text-gray-500">R$ {totalCost.toFixed(2)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 