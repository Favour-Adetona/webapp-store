"use client"

import { cn } from "@/lib/utils"

interface StockLevelBarProps {
  currentStock: number
  lowStockThreshold: number
  className?: string
}

export function StockLevelBar({ currentStock, lowStockThreshold, className }: StockLevelBarProps) {
  // Calculate stock level percentage based on threshold
  // Assume high stock is 3x the threshold, medium is 1.5x the threshold
  const highStockLevel = lowStockThreshold * 3
  const mediumStockLevel = lowStockThreshold * 1.5

  let level: "high" | "medium" | "low" | "out"
  let percentage: number
  let color: string

  if (currentStock === 0) {
    level = "out"
    percentage = 0
    color = "bg-gray-400"
  } else if (currentStock <= lowStockThreshold) {
    level = "low"
    percentage = (currentStock / lowStockThreshold) * 100
    color = "bg-red-500"
  } else if (currentStock <= mediumStockLevel) {
    level = "medium"
    percentage = Math.min(((currentStock - lowStockThreshold) / (mediumStockLevel - lowStockThreshold)) * 100, 100)
    color = "bg-amber-500"
  } else {
    level = "high"
    percentage = 100
    color = "bg-green-500"
  }

  const getLevelText = () => {
    switch (level) {
      case "out":
        return "Out of Stock"
      case "low":
        return "Low Stock"
      case "medium":
        return "Medium Stock"
      case "high":
        return "High Stock"
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium">{getLevelText()}</span>
        <span className="text-muted-foreground">{currentStock} units</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", color)}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>
    </div>
  )
}
