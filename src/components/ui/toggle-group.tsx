'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "single"
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function ToggleGroup({
  className,
  value,
  onValueChange,
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <div className={cn("inline-flex rounded-md border p-1", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<ToggleButtonProps>(child)) {
          return React.cloneElement(child, {
            isSelected: child.props.value === value,
            onSelect: () => onValueChange(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  isSelected?: boolean
  onSelect?: () => void
}

export function ToggleButton({
  isSelected,
  onSelect,
  className,
  children,
  ...props
}: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "ghost"}
      className={cn("rounded-sm", className)}
      onClick={onSelect}
      {...props}
    >
      {children}
    </Button>
  )
} 