'use client'

import { AlertTriangle } from "lucide-react"

interface EmptyStateParameterRequiredProps {
  parameterName: string;
}

export function EmptyStateParameterRequired({ parameterName }: EmptyStateParameterRequiredProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
      <div className="rounded-full bg-amber-100 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Parâmetro Requerido Empty State</h3>
      <p className="text-gray-500 mb-4 max-w-md">
        É necessário fornecer o parâmetro <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{parameterName}</span> na URL para visualizar este conteúdo.
      </p>
      <p className="text-sm text-gray-400">
        Exemplo: <span className="font-mono">?{parameterName}=123</span>
      </p>
    </div>
  )
}