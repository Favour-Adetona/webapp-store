"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentUser } from "@/lib/local-storage"

interface StockAdjustmentFormProps {
  products: any[]
  selectedProduct?: any
  onSave: (adjustment: any) => void
  onCancel: () => void
}

export function StockAdjustmentForm({ products, selectedProduct, onSave, onCancel }: StockAdjustmentFormProps) {
  const [formData, setFormData] = useState({
    productId: selectedProduct?.id || "",
    quantity: 0,
    reason: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const currentUser = getCurrentUser()

    // Format data for saving
    const adjustmentData = {
      ...formData,
      productId: Number.parseInt(formData.productId as string),
      quantity: Number.parseInt(formData.quantity as string),
      userId: currentUser?.id,
      userName: currentUser?.name,
    }

    onSave(adjustmentData)
  }

  // Get selected product details
  const product = products.find((p) => p.id.toString() === formData.productId.toString())

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Select
              value={formData.productId.toString()}
              onValueChange={(value) => handleSelectChange("productId", value)}
              disabled={!!selectedProduct}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {product && (
            <div className="text-sm">
              <p>
                Current stock: <span className="font-medium">{product.stock}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Adjustment</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use positive numbers to add stock, negative to remove stock.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., Damaged in transit, Inventory count correction"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.productId || !formData.quantity}>
              Save Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
