import { cn } from "@/lib/utils";
import React from "react";

export type MetricCardColor = "green" | "purple" | "yellow" | "red" | "blue";

export interface MetricCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  unit: string;
  color?: MetricCardColor;
  className?: string;
}

export function MetricCard({
  title,
  subtitle,
  value,
  unit,
  color = "green",
  className,
}: MetricCardProps) {
  const colorStyles = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      titleColor: "text-green-800",
      subtitleColor: "text-green-600",
      valueColor: "text-green-700"
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      titleColor: "text-purple-800",
      subtitleColor: "text-purple-600",
      valueColor: "text-purple-700"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      titleColor: "text-yellow-800",
      subtitleColor: "text-yellow-600",
      valueColor: "text-yellow-700"
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      titleColor: "text-red-800",
      subtitleColor: "text-red-600",
      valueColor: "text-red-700"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      titleColor: "text-blue-800",
      subtitleColor: "text-blue-600",
      valueColor: "text-blue-700"
    }
  };

  const styles = colorStyles[color];

  return (
    <div className={cn(
      "p-4 border rounded-lg",
      styles.bg,
      styles.border,
      className
    )}>
      <div className="flex flex-col">
        <div className="mb-3">
          <h2 className={cn("text-lg font-semibold", styles.titleColor)}>{title}</h2>
          <p className={styles.subtitleColor}>{subtitle}</p>
        </div>
        <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
          <span className={cn("text-2xl font-bold", styles.valueColor)}>{value}</span>
          <span className="text-xs text-gray-500 mt-1">{unit}</span>
        </div>
      </div>
    </div>
  );
} 