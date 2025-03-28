import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: number;
  name: string;
  contracts: Array<{
    id: number;
    start_date: string;
    end_date: string | null;
  }>;
}

interface CustomerStore {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      selectedCustomer: null,
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
    }),
    {
      name: 'customer-storage',
    }
  )
);