"use client"

import { Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WholesalersTableProps {
  wholesalers: any[]
  onEdit: (wholesaler: any) => void
  onDelete: (wholesalerId: number) => void
}

export function WholesalersTable({ wholesalers, onEdit, onDelete }: WholesalersTableProps) {
  if (!wholesalers.length) {
    return <p className="text-center py-4">No wholesalers found.</p>
  }

  // Format date safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return date.toLocaleDateString()
  }

  // Calculate days left until delivery
  const calculateDaysLeft = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const deliveryDate = new Date(dateString)
    if (isNaN(deliveryDate.getTime())) return "N/A"
    const today = new Date()
    const diff = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Expected Delivery</TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Capital Spent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wholesalers.map((wholesaler) => {
            const daysLeft = calculateDaysLeft(wholesaler.expectedDelivery)
            const isOverdue = daysLeft !== "N/A" && daysLeft < 0

            return (
              <TableRow key={wholesaler.id}>
                <TableCell className="font-medium">{wholesaler.name}</TableCell>
                <TableCell>
                  <div>{wholesaler.contact}</div>
                  <div className="text-sm text-muted-foreground">{wholesaler.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {wholesaler.products.map((product: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatDate(wholesaler.expectedDelivery)}</TableCell>
                <TableCell>
                  {daysLeft === "N/A" ? "N/A" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                  {isOverdue && (
                    <Badge variant="destructive" className="ml-2">
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                <TableCell>₦{(wholesaler.capitalSpent || wholesaler.capital_spent || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(wholesaler)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(wholesaler.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
