import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Demand {
  id: string;
  slug: string | null;
  demand_title: string | null;
  commitment_date: string | null;
  end_date: string | null;
  discarded_at: string | null;
}

export interface DemandCardProps {
  demand: Demand;
}

export function DemandCard({
  demand,
}: DemandCardProps) {
  const { id, slug, demand_title: title, commitment_date, end_date, discarded_at } = demand;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[date.getMonth()];
    
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const calculateLeadTime = () => {
    if (!commitment_date) return null;
    
    const startDate = new Date(commitment_date);
    let endDate;
    
    if (end_date) {
      endDate = new Date(end_date);
    } else if (discarded_at) {
      endDate = new Date(discarded_at);
    } else {
      endDate = new Date(); // Agora
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays.toFixed(2);
  };

  const isInProgress = !end_date && !discarded_at && commitment_date;
  const isNotCommitted = !commitment_date;
  const isDiscarded = !!discarded_at;
  
  const leadTime = calculateLeadTime();
  const now = new Date();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const formattedNow = `${now.getDate().toString().padStart(2, '0')}/${months[now.getMonth()]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <Card
      key={id}
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md border-t-4",
        {
          "border-t-blue-600": !isInProgress && !isNotCommitted && !isDiscarded,
          "border-t-yellow-500": isInProgress,
          "border-t-gray-400": isNotCommitted,
          "border-t-red-500": isDiscarded,
        }
      )}
    >
      <div className="p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">SLUG</div>
          <div className="text-base font-bold break-words text-blue-700 uppercase">
            {slug || <span className="text-gray-400 italic">Sem slug</span>}
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="text-sm font-medium text-gray-500 mb-2">Título</div>
          <div className="text-lg font-semibold break-words">
            {title || <span className="text-gray-400 italic">Sem título</span>}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t">
          <div className="flex justify-between items-center">
            <div>
              {leadTime ? (
                <>
                  <div className="text-sm font-medium text-gray-500">
                    Lead Time
                    {isInProgress && <span className="text-xs ml-1 text-yellow-600">(calculado até agora)</span>}
                  </div>
                  <div className={cn("text-2xl font-bold", {
                    "text-green-600": !isInProgress && !isDiscarded,
                    "text-yellow-600": isInProgress,
                    "text-red-600": isDiscarded,
                  })}>
                    {leadTime} dias
                    {isInProgress && (
                      <div className="text-xs text-yellow-600 mt-1 font-normal">
                        Em progresso
                      </div>
                    )}
                    {isDiscarded && <span className="text-xs ml-1 text-red-600">(descartada)</span>}
                  </div>
                </>
              ) : (
                <div className="text-sm italic text-gray-500">
                  {isNotCommitted ? "Não comprometida" : "Lead time indisponível"}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Início</div>
              {commitment_date ? (
                <div className="text-sm">{formatDate(commitment_date)}</div>
              ) : (
                <div className="text-sm italic text-gray-400">Não definido</div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {isDiscarded ? "Descartada em" : "Fim"}
              </div>
              {end_date ? (
                <div className="text-sm">{formatDate(end_date)}</div>
              ) : isDiscarded ? (
                <div className="text-sm">{formatDate(discarded_at)}</div>
              ) : isInProgress ? (
                <div className="text-sm text-yellow-600">
                  Agora ({formattedNow})
                </div>
              ) : (
                <div className="text-sm italic text-gray-400">Não definido</div>
              )}
            </div>
          </div>
        </div>

        {slug && (
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t">
            <a
              href={`https://tallerflow.atlassian.net/browse/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Abrir no Jira"
            >
              <Image src="/icons/jira.svg" alt="Jira" width={20} height={20} />
            </a>
            <a
              href={`https://www.flowclimate.com.br/companies/taller/demands/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Abrir no Flow Climate"
            >
              <Image
                src="/icons/taller.svg"
                alt="Flow Climate"
                width={20}
                height={20}
              />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
} 