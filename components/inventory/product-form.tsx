"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductFormProps {
  product?: any
  onSave: (product: any) => void
  onCancel: () => void
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const isEditing = !!product

  const [formData, setFormData] = useState({
    id: product?.id || Date.now(),
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    packaging: product?.packaging || "",
    price: product?.price || "",
    stock: product?.stock || 0,
    lowStockThreshold: product?.low_stock_threshold || 5,
    expiryDate: product?.expiry_date
      ? typeof product.expiry_date === "string"
        ? product.expiry_date.split("T")[0]
        : new Date(product.expiry_date).toISOString().split("T")[0]
      : "",
    image: product?.image || "/placeholder.svg?height=100&width=100",
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

    const productData = {
      ...formData,
      price: Number.parseFloat(formData.price as string),
      stock: Number.parseInt(formData.stock as string),
      low_stock_threshold: Number.parseInt(formData.lowStockThreshold as string),
      expiry_date: formData.expiryDate || null,
    }

    console.log("[v0] Submitting product data:", productData)
    onSave(productData)
  }

  const categories = [
    "Liquids",
    "Solids",
    "Semi-Solids/Creams",
    "Single-Use Packs",
    "Sprays & Inhalables",
    "Drops & Applicators",
  ]

  const packagingOptions: Record<string, string[]> = {
    Liquids: ["Bottles (Plastic)", "Bottles (Glass)", "Jars", "Cans", "Refill Pouches"],
    Solids: [
      "Tablets/Pills (strips)",
      "Tablets/Pills (blister packs)",
      "Bars",
      "Powders (sachets)",
      "Powders (packets)",
      "Powders (jars)",
    ],
    "Semi-Solids/Creams": ["Tubes", "Tubs", "Jars"],
    "Single-Use Packs": ["Sachets", "Stick Packs", "Blister Packs"],
    "Sprays & Inhalables": ["Aerosol Cans", "Pump Bottles", "Inhalers"],
    "Drops & Applicators": ["Droppers", "Syringes", "Applicator Tubes"],
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packaging">Packaging</Label>
              <Select
                value={formData.packaging}
                onValueChange={(value) => handleSelectChange("packaging", value)}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select packaging" />
                </SelectTrigger>
                <SelectContent>
                  {formData.category &&
                    packagingOptions[formData.category]?.map((packaging) => (
                      <SelectItem key={packaging} value={packaging}>
                        {packaging}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" value={formData.image} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update Product" : "Add Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
