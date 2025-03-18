'use client'

import { useState } from "react"
import { PortfolioUnitsList } from "./PortfolioUnitsList"
import { PortfolioUnitsTable } from "./PortfolioUnitsTable"
import { ToggleGroup, ToggleButton } from "./toggle-group"
import { Layout, Table } from "lucide-react"

interface PortfolioUnitsViewProps {
  productId: number;
}

export function PortfolioUnitsView({ productId }: PortfolioUnitsViewProps) {
  const [viewMode, setViewMode] = useState<string>("table")

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Unidades de Portfolio</h1>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={setViewMode}
          className="ml-auto"
        >
          <ToggleButton value="table" aria-label="Visualização de tabela">
            <Table className="h-4 w-4 mr-2" />
            Tabela
          </ToggleButton>
          <ToggleButton value="board" aria-label="Visualização de quadro">
            <Layout className="h-4 w-4 mr-2" />
            Quadro
          </ToggleButton>
        </ToggleGroup>
      </div>
      <div className="grid gap-6">
        {viewMode === "table" ? (
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Tabela de Unidades</h2>
            <PortfolioUnitsTable productId={productId} />
          </div>
        ) : (
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Lista de Unidades</h2>
            <PortfolioUnitsList productId={productId} />
          </div>
        )}
      </div>
    </div>
  )
} 