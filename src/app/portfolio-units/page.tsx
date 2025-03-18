import { Metadata } from "next"
import { PortfolioUnitsView } from "@/components/ui/PortfolioUnitsView"
import { EmptyStateParameterRequired } from "@/components/ui/EmptyStateParameterRequired"

export const metadata: Metadata = {
  title: "Unidades de Portfolio",
  description: "Gerenciamento de unidades de portfolio",
}

interface PortfolioUnitsPageProps {
  searchParams: {
    product_id?: string;
  };
}

export default function PortfolioUnitsPage({ searchParams }: PortfolioUnitsPageProps) {
  if (!searchParams.product_id) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Unidades de Portfolio</h1>
        <EmptyStateParameterRequired parameterName="product_id" />
      </div>
    );
  }
  
  const productId = parseInt(searchParams.product_id, 10);
  
  return <PortfolioUnitsView productId={productId} />
} 