"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="mb-8 text-3xl font-bold">GraphQL Data Viewer</h1>
      
      <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Bem-vindo ao visualizador de dados GraphQL</h2>
          <p className="text-gray-600 mb-6">
            Esta é a página inicial. Por favor, acesse a página de demandas para visualizar os dados.
          </p>
          <Link 
            href="/demands" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Ver Demandas
          </Link>
        </div>
      </div>
    </main>
  );
}
