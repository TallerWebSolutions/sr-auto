import { Metadata } from "next"
import { PortfolioUnitsView } from "@/components/ui/PortfolioUnitsView"

export const metadata: Metadata = {
  title: "Unidades de Portfolio",
  description: "Gerenciamento de unidades de portfolio",
}

export default function PortfolioUnitsPage() {
  return <PortfolioUnitsView />
} 