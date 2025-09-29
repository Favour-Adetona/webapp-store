"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getProducts } from "@/lib/supabase-operations"

interface WholesalerFormProps {
  wholesaler?: any
  onSave: (wholesaler: any) => void
  onCancel: () => void
}

export function WholesalerForm({ wholesaler, onSave, onCancel }: WholesalerFormProps) {
  const isEditing = !!wholesaler

  const [formData, setFormData] = useState({
    name: wholesaler?.name || "",
    contact: wholesaler?.contact || "",
    phone: wholesaler?.phone || "",
    products: wholesaler?.products || [],
    expectedDelivery: wholesaler?.expected_delivery
      ? new Date(wholesaler.expected_delivery).toISOString().split("T")[0]
      : "",
    capitalSpent: wholesaler?.capital_spent || 0,
  })

  const [productInput, setProductInput] = useState("")
  const [availableProducts, setAvailableProducts] = useState<string[]>([])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getProducts()
        console.log("[v0] Loaded products:", products, "Is array:", Array.isArray(products))

        const productsArray = Array.isArray(products) ? products : []
        const productNames = productsArray.map((product: any) => product.name)
        setAvailableProducts(productNames)
      } catch (error) {
        console.error("[v0] Error loading products:", error)
        setAvailableProducts([])
      }
    }

    loadProducts()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddProduct = () => {
    if (!productInput.trim()) return

    // Add product if not already in the list
    if (!formData.products.includes(productInput)) {
      setFormData((prev) => ({
        ...prev,
        products: [...prev.products, productInput],
      }))
    }

    setProductInput("")
  }

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...formData.products]
    updatedProducts.splice(index, 1)
    setFormData((prev) => ({ ...prev, products: updatedProducts }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Submitting wholesaler form with data:", formData)

    // Validate required fields
    if (!formData.name || !formData.contact || !formData.phone) {
      console.error("[v0] Missing required fields")
      alert("Please fill in all required fields")
      return
    }

    const wholesalerData = {
      ...(isEditing && wholesaler?.id && { id: wholesaler.id }), // Only include id when editing
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      phone: formData.phone.trim(),
      products: formData.products,
      capital_spent: Number.parseFloat(formData.capitalSpent as string) || 0,
      expected_delivery: formData.expectedDelivery ? new Date(formData.expectedDelivery).toISOString() : null,
    }

    console.log("[v0] Formatted wholesaler data for database:", wholesalerData)

    try {
      onSave(wholesalerData)
      console.log("[v0] onSave called successfully")
    } catch (error) {
      console.error("[v0] Error in onSave:", error)
      alert("Failed to save wholesaler. Please try again.")
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Wholesaler" : "Add New Wholesaler"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wholesaler Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Email</Label>
              <Input
                id="contact"
                name="contact"
                type="email"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
              <Input
                id="expectedDelivery"
                name="expectedDelivery"
                type="date"
                value={formData.expectedDelivery}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capitalSpent">Capital Spent (₦)</Label>
              <Input
                id="capitalSpent"
                name="capitalSpent"
                type="number"
                step="0.01"
                min="0"
                value={formData.capitalSpent}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Products</Label>
            <div className="flex gap-2">
              <Input
                id="productInput"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                placeholder="Enter product name"
                list="product-suggestions"
              />
              <datalist id="product-suggestions">
                {availableProducts.map((product, index) => (
                  <option key={index} value={product} />
                ))}
              </datalist>
              <Button type="button" onClick={handleAddProduct}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                  <span>{product}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => handleRemoveProduct(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update Wholesaler" : "Add Wholesaler"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
