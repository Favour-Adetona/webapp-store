"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Calendar,
  Package,
  Activity,
  RefreshCw,
  Eye,
  ArrowUpRight,
} from "lucide-react"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { LowStockTable } from "@/components/dashboard/low-stock-table"
import { ExpiryAlertsTable } from "@/components/dashboard/expiry-alerts-table"
import { TopSellingProducts } from "@/components/dashboard/top-selling-products"
import { AuditTrail } from "@/components/dashboard/audit-trail"
import { getProducts, getSales, getCurrentUser, getTodaysRevenue } from "@/lib/supabase-operations"

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2000,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(value * easeOutQuart))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export function DashboardPage() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [expiringItems, setExpiringItems] = useState<any[]>([])
  const [todaySales, setTodaySales] = useState<any[]>([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdminState, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const isAdmin = currentUser?.role === "admin"
      setIsAdmin(isAdmin)

      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales(),
      ])

      const safeProductsData = Array.isArray(productsData) ? productsData : []
      const safeSalesData = Array.isArray(salesData) ? salesData : []

      setProducts(safeProductsData)
      setSales(safeSalesData)

      // Only fetch revenue for admin
      let revenue = 0
      if (isAdmin) {
        revenue = await getTodaysRevenue()
      }
      setTodayRevenue(revenue)

      // Filter low stock items
      const lowStock = safeProductsData.filter((product: any) => product.stock <= (product.low_stock_threshold || 0))
      setLowStockItems(lowStock)

      // Filter items expiring in the next 30 days
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const expiring = safeProductsData.filter((product: any) => {
        if (!product.expiry_date) return false
        const expiryDate = new Date(product.expiry_date)
        return expiryDate <= thirtyDaysFromNow
      })
      setExpiringItems(expiring)

      // Calculate today's sales and transactions
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      const todaySalesData = safeSalesData.filter((sale: any) => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= startOfDay && saleDate <= endOfDay
      })
      setTodaySales(todaySalesData)
      setTodayTransactions(todaySalesData.length)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (event.detail === "audit") {
        setActiveTab("audit")
      }
    }

    window.addEventListener("changeTab" as any, handleTabChange)
    return () => window.removeEventListener("changeTab" as any, handleTabChange)
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 space-y-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-orange-500 shadow-xl">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-lg text-muted-foreground">Loading your business insights...</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // STAFF VIEW: Restricted Revenue
  if (!isAdminState) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-orange-500 shadow-xl">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-lg text-muted-foreground">Welcome back! Here's your daily overview.</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* REVENUE CARD: RESTRICTED FOR STAFF */}
            <Card
              className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 overflow-hidden relative cursor-not-allowed"
              onMouseEnter={() => setHoveredCard("revenue")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 to-gray-600/5 opacity-100"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Today's Revenue
                  </CardTitle>
                  <div className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                    —
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Restricted for security</span>
                </div>
              </CardContent>
            </Card>

            {/* PRODUCTS SOLD TODAY: VISIBLE TO STAFF */}
            <Card
              className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-cyan-50 to-orange-50 dark:from-blue-950/50 dark:via-cyan-950/50 dark:to-orange-950/50 overflow-hidden relative cursor-pointer transform hover:scale-[1.02]"
              onMouseEnter={() => setHoveredCard("products")}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setActiveTab("overview")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Products Sold Today
                  </CardTitle>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    <AnimatedCounter
                      value={todaySales.reduce((total, sale) => {
                        return (
                          total +
                          (sale.items?.reduce((itemTotal: number, item: any) => itemTotal + (item.quantity || 0), 0) ||
                            0)
                        )
                      }, 0)}
                    />
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-orange-600 shadow-lg group-hover:shadow-xl transition-all duration-300 ${hoveredCard === "products" ? "scale-110" : ""}`}
                >
                  <Package className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Items sold today</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="border-0 shadow-lg bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/50 dark:via-orange-950/50 dark:to-yellow-950/50 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <AlertTitle className="text-amber-800 dark:text-amber-400 font-semibold">Staff Dashboard</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1">
                  You have access to inventory and sales features. Use the navigation menu to manage your daily tasks.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      </div>
    )
  }

  // ADMIN VIEW: Full Access
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-orange-500 shadow-xl">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-lg text-muted-foreground">Welcome back! Here's your business overview.</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ADMIN: REAL REVENUE */}
          <Card
            className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-cyan-950/50 overflow-hidden relative cursor-pointer transform hover:scale-[1.02]"
            onMouseEnter={() => setHoveredCard("revenue")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setActiveTab("analytics")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Today's Revenue
                </CardTitle>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  <AnimatedCounter value={todayRevenue} prefix="₦" />
                </div>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg group-hover:shadow-xl transition-all duration-300 ${hoveredCard === "revenue" ? "scale-110" : ""}`}
              >
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>
                  From <AnimatedCounter value={todayTransactions} /> transactions today
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-orange-950/50 overflow-hidden relative cursor-pointer transform hover:scale-[1.02]"
            onMouseEnter={() => setHoveredCard("growth")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => setActiveTab("analytics")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Sales Growth
                </CardTitle>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  <AnimatedCounter
                    value={
                      sales.length > 0 ? Number.parseFloat(((todaySales.length / sales.length) * 100).toFixed(1)) : 0
                    }
                    suffix="%"
                  />
                </div>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-orange-600 shadow-lg group-hover:shadow-xl transition-all duration-300 ${hoveredCard === "growth" ? "scale-110" : ""}`}
              >
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Of total sales made today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <StatsCards products={products} sales={sales} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1.5 rounded-2xl border-0 shadow-lg">
            <TabsTrigger
              value="overview"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-200 font-medium hover:bg-white/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-200 font-medium hover:bg-white/50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts
              {(lowStockItems.length > 0 || expiringItems.length > 0) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
                  {lowStockItems.length + expiringItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-200 font-medium hover:bg-white/50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-200 font-medium hover:bg-white/50"
              data-value="audit"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Sales Overview</CardTitle>
                      <CardDescription className="text-base">Monthly revenue performance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-2">
                  <SalesChart sales={sales} type="bar" />
                </CardContent>
              </Card>

              <Card className="col-span-3 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Top Selling Products</CardTitle>
                      <CardDescription className="text-base">Best performing products</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TopSellingProducts sales={sales} products={products} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Low Stock Alerts</CardTitle>
                      <CardDescription className="text-base">Products that need to be restocked soon</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <LowStockTable products={lowStockItems} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-background to-muted/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Expiry Alerts</CardTitle>
                      <CardDescription className="text-base">Products expiring within 30 days</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ExpiryAlertsTable products={expiringItems} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <AnalyticsChart sales={sales} products={products} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-8">
            <AuditTrail />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}