import { Metadata } from "next"
import { PortfolioUnitsView } from "@/components/portfolio-units/PortfolioUnitsView"
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

export default async function PortfolioUnitsPage({ searchParams }: PortfolioUnitsPageProps) {
  const params = await searchParams;
  
  if (!params.product_id) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Unidades de Portfolio</h1>
        <EmptyStateParameterRequired parameterName="product_id" />
      </div>
    );
  }
  
  const productId = parseInt(params.product_id, 10);
  
  return <PortfolioUnitsView productId={productId} />
} 