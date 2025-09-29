"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewSaleForm } from "@/components/sales/new-sale-form"
import { SalesHistory } from "@/components/sales/sales-history"
import { getProducts, getSales } from "@/lib/supabase-operations"

export function SalesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [showNewSaleForm, setShowNewSaleForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [productsData, salesData] = await Promise.all([getProducts(), getSales()])

        setProducts(Array.isArray(productsData) ? productsData : [])
        setSales(Array.isArray(salesData) ? salesData : [])
        setError(null)
      } catch (err) {
        console.error("Failed to load data:", err)
        setError("Failed to load sales data")
        setProducts([])
        setSales([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSaleComplete = async () => {
    try {
      const [updatedProducts, updatedSales] = await Promise.all([getProducts(), getSales()])

      setProducts(Array.isArray(updatedProducts) ? updatedProducts : [])
      setSales(Array.isArray(updatedSales) ? updatedSales : [])
      setShowNewSaleForm(false)
    } catch (err) {
      console.error("Failed to refresh data:", err)
      setError("Failed to refresh data after sale")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading sales data...</div>
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Sales Management</h2>
        <Button onClick={() => setShowNewSaleForm(true)}>New Sale</Button>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Sales History</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <SalesHistory sales={sales} products={products} />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">Select a sale from the Sales History tab to view its receipt.</p>
          </div>
        </TabsContent>
      </Tabs>

      {showNewSaleForm && (
        <NewSaleForm products={products} onComplete={handleSaleComplete} onCancel={() => setShowNewSaleForm(false)} />
      )}
    </div>
  )
}
