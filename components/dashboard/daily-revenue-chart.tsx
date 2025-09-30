"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Calendar } from "lucide-react"

interface DailyRevenueChartProps {
  sales: any[]
}

export function DailyRevenueChart({ sales }: DailyRevenueChartProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [dailyData, setDailyData] = useState<any[]>([])
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([])
  const [monthStats, setMonthStats] = useState({ total: 0, average: 0, highest: 0, transactions: 0 })

  useEffect(() => {
    setMounted(true)

    if (sales && sales.length > 0) {
      // Get unique months from sales data
      const monthsSet = new Set<string>()
      sales.forEach((sale) => {
        const date = new Date(sale.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthsSet.add(monthKey)
      })

      const months = Array.from(monthsSet)
        .sort()
        .reverse()
        .map((monthKey) => {
          const [year, month] = monthKey.split("-")
          const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
          return {
            value: monthKey,
            label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          }
        })

      setAvailableMonths(months)

      // Set current month as default
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0].value)
      }
    }
  }, [sales])

  useEffect(() => {
    if (!selectedMonth || !sales || sales.length === 0) return

    const [year, month] = selectedMonth.split("-").map(Number)

    // Filter sales for selected month
    const monthSales = sales.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      return saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month
    })

    // Group sales by day
    const dailyRevenue: { [key: string]: { revenue: number; transactions: number } } = {}

    monthSales.forEach((sale) => {
      const saleDate = new Date(sale.created_at)
      const day = saleDate.getDate()
      const dayKey = String(day).padStart(2, "0")

      if (!dailyRevenue[dayKey]) {
        dailyRevenue[dayKey] = { revenue: 0, transactions: 0 }
      }

      dailyRevenue[dayKey].revenue += sale.total || 0
      dailyRevenue[dayKey].transactions += 1
    })

    // Get number of days in the selected month
    const daysInMonth = new Date(year, month, 0).getDate()

    // Create array with all days of the month
    const dailyArray = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = String(day).padStart(2, "0")
      dailyArray.push({
        day: dayKey,
        revenue: dailyRevenue[dayKey]?.revenue || 0,
        transactions: dailyRevenue[dayKey]?.transactions || 0,
      })
    }

    setDailyData(dailyArray)

    // Calculate month statistics
    const totalRevenue = dailyArray.reduce((sum, day) => sum + day.revenue, 0)
    const totalTransactions = dailyArray.reduce((sum, day) => sum + day.transactions, 0)
    const averageRevenue = totalRevenue / daysInMonth
    const highestRevenue = Math.max(...dailyArray.map((day) => day.revenue))

    setMonthStats({
      total: totalRevenue,
      average: averageRevenue,
      highest: highestRevenue,
      transactions: totalTransactions,
    })
  }, [selectedMonth, sales])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-muted-foreground">Loading daily revenue data...</div>
      </div>
    )
  }

  if (availableMonths.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Revenue History
          </CardTitle>
          <CardDescription>View daily revenue breakdown for each month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No sales data available yet. Start making sales to see daily revenue history.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-background to-muted/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Daily Revenue History
            </CardTitle>
            <CardDescription className="text-base">Daily revenue breakdown for the selected month</CardDescription>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ₦{monthStats.total.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-muted-foreground mb-1">Daily Average</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              ₦{Math.round(monthStats.average).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-muted-foreground mb-1">Highest Day</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              ₦{monthStats.highest.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {monthStats.transactions.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                className="text-xs"
                label={{ value: "Day of Month", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                className="text-xs"
                label={{ value: "Revenue (₦)", angle: -90, position: "insideLeft" }}
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold mb-2">Day {payload[0].payload.day}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Revenue: ₦{payload[0].payload.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Transactions: {payload[0].payload.transactions}
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* <Legend /> */}

              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Daily Revenue" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 font-semibold">Day</th>
                  <th className="text-right p-3 font-semibold">Revenue</th>
                  <th className="text-right p-3 font-semibold">Transactions</th>
                  <th className="text-right p-3 font-semibold">Avg per Transaction</th>
                </tr>
              </thead>
              <tbody>
                {dailyData
                  .filter((day) => day.revenue > 0)
                  .map((day, index) => (
                    <tr key={index} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-medium">Day {day.day}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₦{day.revenue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">{day.transactions}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        ₦{day.transactions > 0 ? Math.round(day.revenue / day.transactions).toLocaleString() : 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
