"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomerStore } from "@/stores/customerStore";

const GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS = gql`
  query GetCustomersWithActiveContracts {
    customers {
      id
      name
      contracts(
        where: {
          _and: [
            { start_date: { _lte: "now()" } }
            {
              _or: [
                { end_date: { _gte: "now()" } }
                { end_date: { _is_null: true } }
              ]
            }
          ]
        }
      ) {
        id
        start_date
        end_date
      }
    }
  }
`;

interface Customer {
  id: number;
  name: string;
  contracts: Array<{
    id: number;
    start_date: string;
    end_date: string | null;
  }>;
}

export function CustomerSelector() {
  const { selectedCustomer, setSelectedCustomer } = useCustomerStore();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const { loading, error, data } = useQuery(GET_CUSTOMERS_WITH_ACTIVE_CONTRACTS);

  useEffect(() => {
    if (data?.customers) {
      const filteredCustomers = data.customers.filter(
        (customer: Customer) => customer.contracts && customer.contracts.length > 0
      );
      setCustomers(filteredCustomers);
    }
  }, [data]);

  const handleValueChange = (value: string) => {
    const customer = customers.find(c => c.id.toString() === value);
    setSelectedCustomer(customer || null);
  };

  return (
    <div className="px-4 py-2">
      <Select
        value={selectedCustomer?.id.toString() || ""}
        onValueChange={handleValueChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
          <SelectValue placeholder="Selecionar cliente" />
        </SelectTrigger>
        <SelectContent>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id.toString()}>
              {customer.name} ({customer.contracts.length} contrato{customer.contracts.length !== 1 ? 's' : ''})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-red-400 mt-1">
          Erro ao carregar clientes: {error.message}
        </p>
      )}
    </div>
  );
}