import { useState, useEffect } from 'react';

interface ContractEffort {
  totalEffort: number;
  demandsCount: number;
  contract: {
    start_date: string;
    end_date: string;
    total_hours: number;
  };
}

export function useContractEffort(contractId: number | null) {
  const [data, setData] = useState<ContractEffort | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!contractId) {
      setData(null);
      return;
    }

    const fetchEffort = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/contract-effort?contractId=${contractId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error fetching contract effort:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEffort();
  }, [contractId]);

  return { data, loading, error };
} 