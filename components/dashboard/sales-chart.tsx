"use client"

import { useEffect, useState } from "react"
import { SimpleChart } from "@/components/dashboard/simple-chart"

interface SalesChartProps {
  sales: any[]
  type?: "bar" | "line"
}

export function SalesChart({ sales, type = "bar" }: SalesChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-muted/10 rounded-lg">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  return <SimpleChart sales={sales} type={type} />
}
