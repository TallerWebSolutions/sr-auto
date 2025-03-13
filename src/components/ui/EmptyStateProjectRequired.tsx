export function EmptyStateProjectRequired() {
  return (
    <div className="p-12 text-center bg-blue-50 rounded-lg border border-blue-200">
      <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="text-xl font-semibold mb-2">Parâmetro de projeto necessário</h2>
      <p className="text-blue-700 mb-6">
        Por favor, forneça um ID de projeto para visualizar os lead times.
      </p>
    </div>
  );
}
