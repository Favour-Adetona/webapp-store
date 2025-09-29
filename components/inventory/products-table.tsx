"use client"

import Image from "next/image"
import { Edit, Trash2, BarChart2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { isAdmin } from "@/lib/local-storage"
import { StockLevelBar } from "@/components/inventory/stock-level-bar"

interface ProductsTableProps {
  products: any[]
  selectedProducts?: string[]
  onEdit: (product: any) => void
  onDelete: (productId: number) => void
  onAdjustStock: (product: any) => void
  onSelectionChange?: (selectedIds: string[]) => void
  showSelection?: boolean
}

export function ProductsTable({
  products,
  selectedProducts = [],
  onEdit,
  onDelete,
  onAdjustStock,
  onSelectionChange,
  showSelection = false,
}: ProductsTableProps) {
  const admin = isAdmin()

  if (!products.length) {
    return <p className="text-center py-4">No products found.</p>
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(products.map((p) => p.id.toString()))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedProducts, productId])
    } else {
      onSelectionChange(selectedProducts.filter((id) => id !== productId))
    }
  }

  const isAllSelected = products.length > 0 && selectedProducts.length === products.length
  const isIndeterminate = selectedProducts.length > 0 && selectedProducts.length < products.length

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all products"
                  className={isIndeterminate ? "data-[state=checked]:bg-primary" : ""}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate
                  }}
                />
              </TableHead>
            )}
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Packaging</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="hidden sm:table-cell">Stock</TableHead>
            <TableHead className="hidden lg:table-cell">Stock Level</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              {showSelection && (
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id.toString())}
                    onCheckedChange={(checked) => handleSelectProduct(product.id.toString(), checked as boolean)}
                    aria-label={`Select ${product.name}`}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="w-10 h-10 relative">
                  <Image
                    src={product.image || "/placeholder.svg?height=40&width=40"}
                    alt={product.name}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground sm:hidden">
                    {product.category} • ₦{product.price.toFixed(2)}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
              <TableCell className="hidden md:table-cell">{product.packaging}</TableCell>
              <TableCell>₦{product.price.toFixed(2)}</TableCell>
              <TableCell className="hidden sm:table-cell">{product.stock}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <StockLevelBar
                  currentStock={product.stock}
                  lowStockThreshold={product.lowStockThreshold}
                  className="min-w-[120px]"
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onAdjustStock(product)} className="h-8 w-8">
                    <BarChart2 className="h-4 w-4" />
                    <span className="sr-only">Adjust Stock</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(product)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  {admin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(product.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
