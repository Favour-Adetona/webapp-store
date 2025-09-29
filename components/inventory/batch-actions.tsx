"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, X, BarChart2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BatchActionsProps {
  selectedProducts: string[]
  products: any[]
  onClearSelection: () => void
  onBatchDelete: (productIds: string[]) => void
  onBatchStockAdjust: (productIds: string[]) => void
}

export function BatchActions({
  selectedProducts,
  products,
  onClearSelection,
  onBatchDelete,
  onBatchStockAdjust,
}: BatchActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  if (selectedProducts.length === 0) return null

  const selectedProductsData = products.filter((p) => selectedProducts.includes(p.id.toString()))

  const handleBatchDelete = () => {
    onBatchDelete(selectedProducts)
    setShowDeleteDialog(false)
    toast({
      title: "Products deleted",
      description: `${selectedProducts.length} products have been deleted`,
    })
  }

  const handleBatchStockAdjust = () => {
    onBatchStockAdjust(selectedProducts)
    toast({
      title: "Batch stock adjustment",
      description: "Opening stock adjustment for selected products",
    })
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 shrink-0">
                {selectedProducts.length} selected
              </Badge>
              <span className="text-sm text-muted-foreground truncate">
                {selectedProductsData
                  .slice(0, 3)
                  .map((p) => p.name)
                  .join(", ")}
                {selectedProductsData.length > 3 && ` +${selectedProductsData.length - 3} more`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchStockAdjust}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Adjust Stock</span>
                <span className="sm:hidden">Adjust</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length} selected products? This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Products to delete:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {selectedProductsData.slice(0, 5).map((product) => (
                    <li key={product.id} className="truncate">
                      {product.name}
                    </li>
                  ))}
                  {selectedProductsData.length > 5 && <li>...and {selectedProductsData.length - 5} more</li>}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground w-full sm:w-auto"
            >
              Delete {selectedProducts.length} Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
