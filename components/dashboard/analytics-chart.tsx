"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleChart } from "@/components/dashboard/simple-chart"
import { DailyRevenueChart } from "@/components/dashboard/daily-revenue-chart"

interface AnalyticsChartProps {
  sales: any[]
  products: any[]
}

export function AnalyticsChart({ sales, products }: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)

    if (sales && sales.length > 0) {
      const categoryRevenue: { [key: string]: { revenue: number; count: number } } = {}

      sales.forEach((sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: any) => {
            const category = item.category || "Uncategorized"
            if (!categoryRevenue[category]) {
              categoryRevenue[category] = { revenue: 0, count: 0 }
            }
            categoryRevenue[category].revenue += (item.price || 0) * (item.quantity || 0)
            categoryRevenue[category].count += item.quantity || 0
          })
        }
      })

      const categoryArray = Object.entries(categoryRevenue).map(([category, data]) => ({
        category,
        revenue: data.revenue,
        count: data.count,
      }))

      setCategoryData(categoryArray.sort((a, b) => b.revenue - a.revenue))

      const productSales: { [key: string]: { name: string; category: string; revenue: number; quantity: number } } = {}

      sales.forEach((sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: any) => {
            const productId = item.id || item.name
            if (!productSales[productId]) {
              productSales[productId] = {
                name: item.name || "Unknown",
                category: item.category || "Uncategorized",
                revenue: 0,
                quantity: 0,
              }
            }
            productSales[productId].revenue += (item.price || 0) * (item.quantity || 0)
            productSales[productId].quantity += item.quantity || 0
          })
        }
      })

      const topProductsArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setTopProducts(topProductsArray)
    } else {
      setCategoryData([])
      setTopProducts([])
    }
  }, [sales])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="daily">Daily Performance</TabsTrigger>
          <TabsTrigger value="history">Daily History</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart sales={sales} type="line" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart sales={sales} type="bar" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">{category.count} items sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₦{category.revenue.toLocaleString()}</p>
                        <div className="w-24 h-2 bg-muted rounded-full mt-1">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{
                              width: `${(category.revenue / Math.max(...categoryData.map((c) => c.revenue))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available yet. Start making sales to see analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₦{product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No product data available yet. Start making sales to see top products.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart sales={sales} type="bar" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart sales={sales} type="line" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <DailyRevenueChart sales={sales} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
