"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, Scan } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser, createSale, updateProductStocks } from "@/lib/supabase-operations"
import { Receipt } from "@/components/sales/receipt"
import { QRScanner } from "@/components/sales/qr-scanner"
import { logSale } from "@/lib/audit-logger"

interface NewSaleFormProps {
  products: any[]
  onComplete: () => void
  onCancel: () => void
}

export function NewSaleForm({ products, onComplete, onCancel }: NewSaleFormProps) {
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [newSale, setNewSale] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [cashierName, setCashierName] = useState("")

  useEffect(() => {
    const productsArray = Array.isArray(products) ? products : []
    const availableProducts = productsArray.filter((product) => product.stock > 0)

    if (searchQuery.trim() === "") {
      setFilteredProducts(availableProducts)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = availableProducts.filter(
        (product) => product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query),
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  const subtotal = saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = (discount / 100) * subtotal
  const total = subtotal - discountAmount

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return
    const product = products.find((p) => p.id.toString() === selectedProductId)
    if (!product) return
    addProductToSale(product, quantity)
  }

  const addProductToSale = (product: any, qty = 1) => {
    if (product.stock < qty) {
      toast({
        variant: "destructive",
        title: "Insufficient stock",
        description: `Only ${product.stock} units available.`,
      })
      return
    }

    const existingItemIndex = saleItems.findIndex((item) => item.productId.toString() === product.id.toString())

    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems]
      const newQuantity = updatedItems[existingItemIndex].quantity + qty
      if (product.stock < newQuantity) {
        toast({
          variant: "destructive",
          title: "Insufficient stock",
          description: `Only ${product.stock} units available.`,
        })
        return
      }
      updatedItems[existingItemIndex].quantity = newQuantity
      setSaleItems(updatedItems)
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          packaging: product.packaging,
          category: product.category,
        },
      ])
    }

    setSelectedProductId("")
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...saleItems]
    updatedItems.splice(index, 1)
    setSaleItems(updatedItems)
  }

  const handleCompleteSale = async () => {
    if (saleItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items added",
        description: "Please add at least one item to complete the sale.",
      })
      return
    }

    try {
      setIsLoading(true)
      const currentUser = await getCurrentUser()
      if (!currentUser) throw new Error("User not authenticated")

      const saleData = {
        items: saleItems,
        subtotal,
        discount,
        discount_amount: discountAmount,
        total,
        user_name: cashierName || currentUser.name,
      }

      console.log("[v0] Creating sale with data:", saleData)
      const createdSale = await createSale(saleData)

      if (createdSale) {
        const stockUpdates = saleItems.map((item) => ({ productId: item.productId, quantityChange: -item.quantity }))
        const stockUpdateSuccess = await updateProductStocks(stockUpdates)

        if (stockUpdateSuccess) await logSale(createdSale)

        setNewSale(createdSale)
        setShowReceipt(true)

        toast({ title: "Success", description: "Sale completed successfully" })
      }
    } catch (error: any) {
      console.error("[v0] Error completing sale:", error)
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to complete sale" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = () => {
    setShowReceipt(false)
    onComplete()
  }

  return (
    <>
      <Dialog open={!showReceipt && !showQRScanner} onOpenChange={onCancel}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cashier Input */}
            <div className="space-y-2">
              <Label htmlFor="cashierName">Cashier Name</Label>
              <Input
                id="cashierName"
                placeholder="Enter cashier name"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 mb-2"
                  />
                </div>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Select a product</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id.toString()}>
                      {product.name} - ₦{product.price.toFixed(2)} ({product.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddItem} disabled={!selectedProductId || quantity <= 0} className="h-10">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowQRScanner(true)} className="flex items-center gap-2">
                <Scan className="h-4 w-4" /> Scan QR Code
              </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Product</TableHead>
                    <TableHead className="min-w-[80px]">Price</TableHead>
                    <TableHead className="min-w-[60px]">Qty</TableHead>
                    <TableHead className="min-w-[80px]">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    saleItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <div className="truncate">{item.name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              ₦{item.price.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">₦{item.price.toFixed(2)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{item.quantity}</TableCell>
                        <TableCell>₦{(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1 text-right sm:pt-6">
                <div className="text-sm">Subtotal: ₦{subtotal.toFixed(2)}</div>
                {discount > 0 && <div className="text-sm">Discount: ₦{discountAmount.toFixed(2)}</div>}
                <div className="text-lg font-bold">Total: ₦{total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={saleItems.length === 0 || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Processing..." : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showQRScanner && (
        <QRScanner
          products={products}
          onProductScanned={(p) => {
            addProductToSale(p)
            setShowQRScanner(false)
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
      {showReceipt && newSale && <Receipt sale={newSale} onClose={handleFinish} />}
    </>
  )
}
