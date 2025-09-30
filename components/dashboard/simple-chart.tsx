"use client"

import { useEffect, useState } from "react"

interface SimpleChartProps {
  sales: any[]
  type?: "bar" | "line"
}

export function SimpleChart({ sales, type = "bar" }: SimpleChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!sales || sales.length === 0) {
      // If no sales data, show empty chart
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      const emptyData = months.map((month) => ({
        name: month,
        value: 0,
        height: 0,
      }))
      setChartData(emptyData)
      return
    }

    // Group sales by month
    const monthlyData: { [key: string]: number } = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    sales.forEach((sale) => {
      const date = new Date(sale.created_at)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (sale.total || 0)
    })

    // Get last 6 months of data
    const sortedMonths = Object.keys(monthlyData)
      .sort((a, b) => {
        const dateA = new Date(a)
        const dateB = new Date(b)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-6)

    const maxValue = Math.max(...sortedMonths.map((month) => monthlyData[month]), 1)

    const realData = sortedMonths.map((month) => ({
      name: month.split(" ")[0], // Just show month name
      value: monthlyData[month],
      height: (monthlyData[month] / maxValue) * 100,
    }))

    setChartData(realData)
  }, [sales])

  const maxValue = Math.max(...chartData.map((d) => d.value), 1)

  if (type === "line") {
    return (
      <div className="w-full h-[350px] flex items-end justify-between p-4 bg-muted/10 rounded-lg">
        <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="0"
              y1={60 * i}
              x2="400"
              y2={60 * i}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.2"
              strokeDasharray="2,2"
            />
          ))}

          {/* Line chart */}
          {chartData.length > 1 && (
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              points={chartData
                .map((d, i) => `${(i * 400) / (chartData.length - 1)},${300 - (d.value / maxValue) * 250}`)
                .join(" ")}
            />
          )}

          {/* Data points */}
          {chartData.map((d, i) => (
            <circle
              key={i}
              cx={(i * 400) / (chartData.length - 1)}
              cy={300 - (d.value / maxValue) * 250}
              r="4"
              fill="hsl(var(--primary))"
            />
          ))}

          {/* Labels */}
          {chartData.map((d, i) => (
            <text
              key={i}
              x={(i * 400) / (chartData.length - 1)}
              y="320"
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--muted-foreground))"
            >
              {d.name}
            </text>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className="w-full h-[350px] flex items-end justify-between p-4 bg-muted/10 rounded-lg">
      {chartData.map((data, index) => (
        <div key={index} className="flex flex-col items-center flex-1 mx-1">
          <div className="text-xs text-muted-foreground mb-2">₦{data.value.toLocaleString()}</div>
          <div
            className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out"
            style={{ height: `${data.height}%`, minHeight: data.value > 0 ? "2%" : "0%" }}
          />
          <div className="text-xs text-muted-foreground mt-2 font-medium">{data.name}</div>
        </div>
      ))}
    </div>
  )
}
