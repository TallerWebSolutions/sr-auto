import React from 'react';
import { Card } from "@/components/ui/card";

export function LoadingState() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Consumo de Horas</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mt-3"></div>
          </Card>
        ))}
      </div>
    </main>
  );
} 