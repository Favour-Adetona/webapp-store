"use client"

import { useEffect, useState } from "react"

interface TopSellingProductsProps {
  sales: any[]
  products: any[]
}

export function TopSellingProducts({ sales, products }: TopSellingProductsProps) {
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    if (!sales.length) {
      // If no sales data, show products sorted by stock (assuming popular products have lower stock)
      const sorted = [...products].sort((a, b) => a.stock - b.stock).slice(0, 5)
      setTopProducts(
        sorted.map((product) => ({
          id: product.id,
          name: product.name,
          quantity: 0,
          total: 0,
        })),
      )
      return
    }

    // Count product sales
    const productSales: Record<string, { quantity: number; total: number }> = {}

    sales.forEach((sale) => {
      sale.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { quantity: 0, total: 0 }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].total += item.price * item.quantity
      })
    })

    // Convert to array and sort by quantity
    const topProductsData = Object.keys(productSales)
      .map((productId) => {
        const product = products.find((p) => p.id.toString() === productId)
        return {
          id: productId,
          name: product ? product.name : `Product #${productId}`,
          quantity: productSales[productId].quantity,
          total: productSales[productId].total,
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    setTopProducts(topProductsData)
  }, [sales, products])

  if (!topProducts.length) {
    return <p className="text-sm text-muted-foreground">No sales data available.</p>
  }

  return (
    <div className="space-y-4">
      {topProducts.map((product) => (
        <div key={product.id} className="flex items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              {product.quantity} units sold (₦{product.total.toFixed(2)})
            </p>
          </div>
          <div className="ml-auto font-medium">
            {((product.quantity / topProducts.reduce((sum, p) => sum + p.quantity, 0)) * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  )
}
