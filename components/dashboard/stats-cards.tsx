"use client"

import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatsCardsProps {
  products: any[]
  sales: any[]
}

export function StatsCards({ products, sales }: StatsCardsProps) {
  // Calculate total sales
  const totalSales = sales.reduce((sum, sale) => sum + sale?.total || 0, 0)

  // Calculate total products
  const totalProducts = products.length

  // Calculate total inventory value
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)

  // Calculate total transactions
  const totalTransactions = sales.length

  // Calculate growth percentages (mock data for demo)
  const revenueGrowth = 12.5
  const productGrowth = 8.2
  const inventoryGrowth = -3.1
  const transactionGrowth = 15.8

  const stats = [
    {
      title: "Total Revenue",
      value: `₦${totalSales.toLocaleString()}`,
      description: "From all transactions",
      icon: DollarSign,
      growth: revenueGrowth,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Products",
      value: totalProducts.toString(),
      description: "Total unique products",
      icon: Package,
      growth: productGrowth,
      color: "from-blue-500 to-cyan-600",
    },
    {
      title: "Inventory Value",
      value: `₦${inventoryValue.toLocaleString()}`,
      description: "Total value of current stock",
      icon: TrendingUp,
      growth: inventoryGrowth,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Transactions",
      value: totalTransactions.toString(),
      description: "Total completed sales",
      icon: ShoppingCart,
      growth: transactionGrowth,
      color: "from-orange-500 to-red-600",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="card-hover border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
              <stat.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  stat.growth > 0
                    ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                    : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
                )}
              >
                {stat.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(stat.growth)}%
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
