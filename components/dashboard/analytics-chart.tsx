"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleChart } from "@/components/dashboard/simple-chart"

interface AnalyticsChartProps {
  sales: any[]
  products: any[]
}

export function AnalyticsChart({ sales, products }: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false)
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)

    // Generate sample category data
    const categories = ["Liquids", "Solids", "Creams", "Sprays", "Drops"]
    const sampleCategoryData = categories.map((category) => ({
      category,
      revenue: Math.floor(Math.random() * 100000) + 20000,
      count: Math.floor(Math.random() * 50) + 10,
    }))
    setCategoryData(sampleCategoryData)
  }, [])

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="daily">Daily Performance</TabsTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-2 border rounded">
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
                      <p className="font-bold">
                        ₦{(product.price * Math.floor(Math.random() * 20 + 5)).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 20 + 5)} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
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
      </Tabs>
    </div>
  )
}
