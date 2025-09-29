"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Receipt } from "@/components/sales/receipt"

interface SalesHistoryProps {
  sales: any[]
  products: any[]
}

export function SalesHistory({ sales, products }: SalesHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSale, setSelectedSale] = useState<any>(null)

  console.log("[v0] Sales data type:", typeof sales, "Value:", sales)

  // Ensure sales is always an array
  const salesArray = Array.isArray(sales) ? sales : []

  // Format date safely, fallback to created_at if date is missing
  const formatDate = (dateString?: string | null, fallback?: string | null) => {
    const date = new Date(dateString || fallback)
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
  }

  // Filter sales based on search query
  const filteredSales = salesArray.filter((sale) => {
    const searchLower = searchQuery.toLowerCase()

    // Search by receipt number
    if (sale.id?.toString().includes(searchLower)) return true

    // Search by cashier name
    if (sale.cashier_name?.toLowerCase().includes(searchLower)) return true

    // Search by product name - add safety check for items array
    if (Array.isArray(sale.items)) {
      const hasMatchingProduct = sale.items.some((item: any) =>
        item.name?.toLowerCase().includes(searchLower)
      )
      if (hasMatchingProduct) return true
    }

    return false
  })

  if (!salesArray || !salesArray.length) {
    return <p className="text-center py-4">No sales records found.</p>
  }

  return (
    <>
      <div className="flex items-center mb-4">
        <Input
          placeholder="Search by receipt #, cashier, or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>User</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No sales found matching your search
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{formatDate(sale.date, sale.created_at)}</TableCell>
                  <TableCell>{Array.isArray(sale.items) ? sale.items.length : 0} items</TableCell>
                  <TableCell>₦{sale.total?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>{sale.cashier_name || "N/A"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedSale(sale)}>
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedSale && <Receipt sale={selectedSale} onClose={() => setSelectedSale(null)} />}
    </>
  )
}
