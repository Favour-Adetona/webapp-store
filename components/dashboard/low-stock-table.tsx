"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LowStockTableProps {
  products: any[]
}

export function LowStockTable({ products }: LowStockTableProps) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">No low stock items found.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.lowStockThreshold}</TableCell>
              <TableCell>
                {product.stock === 0 ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Low Stock
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
