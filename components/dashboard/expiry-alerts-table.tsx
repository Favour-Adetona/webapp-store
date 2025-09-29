"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ExpiryAlertsTableProps {
  products: any[]
}

export function ExpiryAlertsTable({ products }: ExpiryAlertsTableProps) {
  if (!products.length) {
    return <p className="text-sm text-muted-foreground">No products expiring soon.</p>
  }

  // Calculate days until expiry safely
  const calculateDaysUntil = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const daysLeft = calculateDaysUntil(product.expiry_date)

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell>{daysLeft !== null ? daysLeft : "N/A"}</TableCell>
                <TableCell>
                  {daysLeft === null ? (
                    <Badge variant="outline">Unknown</Badge>
                  ) : daysLeft <= 7 ? (
                    <Badge variant="destructive">Critical</Badge>
                  ) : daysLeft <= 15 ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Warning
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      Approaching
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
