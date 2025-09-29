"use client"

import { useState, useEffect } from "react"
import { Plus, Upload, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductsTable } from "@/components/inventory/products-table"
import { ProductForm } from "@/components/inventory/product-form"
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form"
import { CSVImport } from "@/components/inventory/csv-import"
import { BatchActions } from "@/components/inventory/batch-actions"
import { BatchStockAdjustment } from "@/components/inventory/batch-stock-adjustment"
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createStockAdjustment,
  updateProductStock,
} from "@/lib/supabase-operations"
import { logInventoryAdd, logInventoryEdit, logStockAdjustment } from "@/lib/audit-logger"
import { useToast } from "@/components/ui/use-toast"
import { isAdmin } from "@/lib/local-storage"

export function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showBatchSelection, setShowBatchSelection] = useState(false)
  const [showBatchStockAdjustment, setShowBatchStockAdjustment] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const admin = isAdmin()

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const productsData = await getProducts()
      setProducts(productsData)
      setFilteredProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    let filtered = [...products]

    if (searchQuery) {
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, categoryFilter])

  const categories = ["all", ...new Set(products.map((product) => product.category))]

  const handleBatchDelete = async (productIds: string[]) => {
    try {
      setIsLoading(true)
      let successCount = 0

      for (const productId of productIds) {
        try {
          await deleteProduct(productId)
          successCount++
        } catch (error) {
          console.error("Error deleting product:", productId, error)
        }
      }

      await loadProducts()
      setSelectedProducts([])
      setShowBatchSelection(false)

      toast({
        title: "Batch delete completed",
        description: `Successfully deleted ${successCount} of ${productIds.length} products`,
      })
    } catch (error: any) {
      console.error("Error during batch delete:", error)
      toast({
        variant: "destructive",
        title: "Batch delete failed",
        description: error.message || "Failed to delete products",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchStockAdjustment = async (adjustments: any[]) => {
    try {
      setIsLoading(true)
      let successCount = 0

      for (const adjustment of adjustments) {
        try {
          const success = await updateProductStock(adjustment.productId, adjustment.quantity)
          if (success) {
            await createStockAdjustment({
              product_id: adjustment.productId,
              product_name: adjustment.productName,
              quantity: adjustment.quantity,
              reason: adjustment.reason,
            })

            await logStockAdjustment(adjustment)
            successCount++
          }
        } catch (error) {
          console.error("Error adjusting stock for product:", adjustment.productId, error)
        }
      }

      await loadProducts()
      setSelectedProducts([])
      setShowBatchSelection(false)
      setShowBatchStockAdjustment(false)

      toast({
        title: "Batch stock adjustment completed",
        description: `Successfully adjusted stock for ${successCount} of ${adjustments.length} products`,
      })
    } catch (error: any) {
      console.error("Error during batch stock adjustment:", error)
      toast({
        variant: "destructive",
        title: "Batch adjustment failed",
        description: error.message || "Failed to adjust stock",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (newProduct: any) => {
    try {
      setIsLoading(true)
      const createdProduct = await createProduct({
        name: newProduct.name,
        category: newProduct.category,
        packaging: newProduct.packaging,
        price: newProduct.price,
        stock: newProduct.stock || 0,
        low_stock_threshold: newProduct.lowStockThreshold || 10,
        expiry_date: newProduct.expiryDate,
        image: newProduct.image,
      })

      if (createdProduct) {
        await loadProducts()
        await logInventoryAdd(createdProduct)
        toast({
          title: "Success",
          description: "Product added successfully",
        })
      }
      setShowProductForm(false)
    } catch (error: any) {
      console.error("Error adding product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add product",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCSVImport = async (importedProducts: any[]) => {
    try {
      setIsLoading(true)
      let successCount = 0
      let errorCount = 0

      for (const product of importedProducts) {
        try {
          const createdProduct = await createProduct({
            name: product.name,
            category: product.category,
            packaging: product.packaging,
            price: product.price,
            stock: product.stock || 0,
            low_stock_threshold: product.lowStockThreshold || 10,
            expiry_date: product.expiryDate,
            image: product.image || "/placeholder.svg?height=100&width=100",
            description: product.description,
          })

          if (createdProduct) {
            await logInventoryAdd(createdProduct)
            successCount++
          }
        } catch (error) {
          console.error("Error importing product:", product.name, error)
          errorCount++
        }
      }

      await loadProducts()

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} products. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
      })

      setShowCSVImport(false)
    } catch (error: any) {
      console.error("Error during CSV import:", error)
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Failed to import products",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = async (updatedProduct: any) => {
    try {
      setIsLoading(true)
      const result = await updateProduct(updatedProduct.id, {
        name: updatedProduct.name,
        category: updatedProduct.category,
        packaging: updatedProduct.packaging,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        low_stock_threshold: updatedProduct.lowStockThreshold,
        expiry_date: updatedProduct.expiryDate,
        image: updatedProduct.image,
      })

      if (result) {
        await loadProducts()
        await logInventoryEdit(result, { action: "product_updated" })
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      }
      setSelectedProduct(null)
      setShowProductForm(false)
    } catch (error: any) {
      console.error("Error updating product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update product",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      setIsLoading(true)
      const success = await deleteProduct(productId)

      if (success) {
        await loadProducts()
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      }
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete product",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockAdjustment = async (adjustment: any) => {
    try {
      setIsLoading(true)

      const success = await updateProductStock(adjustment.productId, adjustment.quantity)

      if (success) {
        const product = products.find((p) => p.id === adjustment.productId)
        await createStockAdjustment({
          product_id: adjustment.productId,
          product_name: product?.name || "Unknown Product",
          quantity: adjustment.quantity,
          reason: adjustment.reason,
        })

        await logStockAdjustment({
          ...adjustment,
          productName: product?.name || "Unknown Product",
        })

        await loadProducts()
        toast({
          title: "Success",
          description: "Stock adjusted successfully",
        })
      }

      setShowAdjustmentForm(false)
      setSelectedProduct(null)
    } catch (error: any) {
      console.error("Error adjusting stock:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to adjust stock",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setSelectedProduct(null)
              setShowProductForm(true)
            }}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button variant="outline" onClick={() => setShowCSVImport(true)} disabled={isLoading}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          {admin && (
            <Button
              variant="outline"
              onClick={() => {
                setShowBatchSelection(!showBatchSelection)
                if (showBatchSelection) {
                  setSelectedProducts([])
                }
              }}
              disabled={isLoading}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {showBatchSelection ? "Cancel Selection" : "Batch Select"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedProduct(null)
              setShowAdjustmentForm(true)
            }}
            disabled={isLoading}
          >
            Adjust Stock
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showBatchSelection && (
        <BatchActions
          selectedProducts={selectedProducts}
          products={filteredProducts}
          onClearSelection={() => setSelectedProducts([])}
          onBatchDelete={handleBatchDelete}
          onBatchStockAdjust={() => setShowBatchStockAdjustment(true)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ProductsTable
          products={filteredProducts}
          selectedProducts={selectedProducts}
          showSelection={showBatchSelection}
          onSelectionChange={setSelectedProducts}
          onEdit={(product) => {
            setSelectedProduct(product)
            setShowProductForm(true)
          }}
          onDelete={handleDeleteProduct}
          onAdjustStock={(product) => {
            setSelectedProduct(product)
            setShowAdjustmentForm(true)
          }}
        />
      )}

      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onSave={selectedProduct ? handleEditProduct : handleAddProduct}
          onCancel={() => {
            setShowProductForm(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {showCSVImport && <CSVImport onImport={handleCSVImport} onClose={() => setShowCSVImport(false)} />}

      {showBatchStockAdjustment && (
        <BatchStockAdjustment
          products={products}
          selectedProductIds={selectedProducts}
          onSave={handleBatchStockAdjustment}
          onCancel={() => setShowBatchStockAdjustment(false)}
        />
      )}

      {showAdjustmentForm && (
        <StockAdjustmentForm
          products={products}
          selectedProduct={selectedProduct}
          onSave={handleStockAdjustment}
          onCancel={() => {
            setShowAdjustmentForm(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
