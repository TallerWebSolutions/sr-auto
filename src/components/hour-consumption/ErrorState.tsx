import React from 'react';
import { ApolloError } from '@apollo/client';

interface ErrorStateProps {
  error: ApolloError | Error;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <main className="container mx-auto p-4">
      <h1 className="mb-8 text-3xl font-bold">Consumo de Horas</h1>
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-700">Erro ao carregar dados de consumo</h2>
        </div>
        <div className="text-red-500 bg-red-100 p-3 rounded">
          {error.message}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
} 