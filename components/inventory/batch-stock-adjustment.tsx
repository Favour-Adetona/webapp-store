"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface BatchStockAdjustmentProps {
  products: any[]
  selectedProductIds: string[]
  onSave: (adjustments: any[]) => void
  onCancel: () => void
}

export function BatchStockAdjustment({ products, selectedProductIds, onSave, onCancel }: BatchStockAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | "set">("add")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id.toString()))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantity || !reason) return

    const adjustments = selectedProducts.map((product) => {
      let newStock = product.stock
      const qty = Number.parseInt(quantity)

      switch (adjustmentType) {
        case "add":
          newStock = product.stock + qty
          break
        case "subtract":
          newStock = Math.max(0, product.stock - qty)
          break
        case "set":
          newStock = qty
          break
      }

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        newStock,
        quantity: newStock - product.stock,
        reason,
        adjustmentType,
      }
    })

    onSave(adjustments)
  }

  const getPreviewStock = (currentStock: number) => {
    const qty = Number.parseInt(quantity) || 0
    switch (adjustmentType) {
      case "add":
        return currentStock + qty
      case "subtract":
        return Math.max(0, currentStock - qty)
      case "set":
        return qty
      default:
        return currentStock
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Stock Adjustment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to Stock</SelectItem>
                  <SelectItem value="subtract">Subtract from Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for stock adjustment..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Preview Changes</Label>
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((product) => {
                    const newStock = getPreviewStock(product.stock)
                    const change = newStock - product.stock
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{newStock}</TableCell>
                        <TableCell>
                          <Badge variant={change > 0 ? "default" : change < 0 ? "destructive" : "secondary"}>
                            {change > 0 ? "+" : ""}
                            {change}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Apply to {selectedProducts.length} Products</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
