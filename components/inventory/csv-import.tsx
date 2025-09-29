"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CSVImportProps {
  onImport: (products: any[]) => void
  onClose: () => void
}

interface ParsedProduct {
  name?: string
  category?: string
  packaging?: string
  price?: number
  stock?: number
  low_stock_threshold?: number
  expiry_date?: string | null
  image?: string
  description?: string
  errors: string[]
  isValid: boolean
}

export function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [csvData, setCsvData] = useState<string>("")
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const expectedHeaders = [
    "name",
    "category",
    "packaging",
    "price",
    "stock",
    "low_stock_threshold",
    "expiry_date",
    "image",
    "description",
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select a CSV file",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvData(content)
      parseCSV(content)
    }
    reader.readAsText(file)
  }

  const parseCSV = (content: string) => {
    setIsProcessing(true)

    try {
      const lines = content.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        toast({
          variant: "destructive",
          title: "Invalid CSV",
          description: "CSV must contain at least a header row and one data row",
        })
        setIsProcessing(false)
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const dataLines = lines.slice(1)

      const products: ParsedProduct[] = dataLines.map((line, index) => {
        const values = line.split(",").map((v) => v.trim())
        const product: ParsedProduct = { errors: [], isValid: true }

        headers.forEach((header, i) => {
          const value = values[i] || ""

          switch (header) {
            case "name":
              if (value) {
                product.name = value
              } else {
                product.errors.push("Name is required")
                product.isValid = false
              }
              break
            case "category":
              product.category = value || "General"
              break
            case "packaging":
              product.packaging = value || "Unit"
              break
            case "price":
              if (value) {
                const price = Number.parseFloat(value)
                if (isNaN(price) || price < 0) {
                  product.errors.push("Invalid price")
                  product.isValid = false
                } else {
                  product.price = price
                }
              } else {
                product.errors.push("Price is required")
                product.isValid = false
              }
              break
            case "stock":
              if (value) {
                const stock = Number.parseInt(value)
                if (isNaN(stock) || stock < 0) {
                  product.errors.push("Invalid stock quantity")
                  product.isValid = false
                } else {
                  product.stock = stock
                }
              } else {
                product.stock = 0
              }
              break
            case "lowstockthreshold":
            case "low_stock_threshold":
              if (value) {
                const threshold = Number.parseInt(value)
                if (isNaN(threshold) || threshold < 0) {
                  product.errors.push("Invalid low stock threshold")
                } else {
                  product.low_stock_threshold = threshold
                }
              } else {
                product.low_stock_threshold = 5
              }
              break
            case "expirydate":
            case "expiry_date":
              if (value && value.trim() !== "") {
                const date = new Date(value)
                if (isNaN(date.getTime())) {
                  product.expiry_date = null
                } else {
                  product.expiry_date = date.toISOString()
                }
              } else {
                product.expiry_date = null
              }
              break
            case "image":
              product.image = value || "/placeholder.svg?height=100&width=100"
              break
            case "description":
              product.description = value || ""
              break
          }
        })

        return product
      })

      setParsedProducts(products)
      setShowPreview(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Parse error",
        description: "Failed to parse CSV file. Please check the format.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = () => {
    const validProducts = parsedProducts.filter((p) => p.isValid)

    if (validProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "No valid products",
        description: "Please fix the errors before importing",
      })
      return
    }

    const productsToImport = validProducts.map((p) => ({
      name: p.name,
      category: p.category,
      packaging: p.packaging,
      price: p.price,
      stock: p.stock || 0,
      low_stock_threshold: p.low_stock_threshold || 5,
      expiry_date: p.expiry_date,
      image: p.image,
      description: p.description,
    }))

    onImport(productsToImport)
  }

  const downloadTemplate = () => {
    const headers = "name,category,packaging,price,stock,low_stock_threshold,expiry_date,image,description"
    const sampleData =
      "Sample Product,Liquids,Bottles (Plastic),25.50,100,10,,/placeholder.svg,Sample product description"
    const csvContent = `${headers}\n${sampleData}`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "product_import_template.csv"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Template downloaded",
      description: "Use this template to format your product data",
    })
  }

  const validCount = parsedProducts.filter((p) => p.isValid).length
  const errorCount = parsedProducts.filter((p) => !p.isValid).length

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Products from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showPreview && (
            <>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with product data. Required columns: name, price. Optional columns: category,
                  packaging, stock, low_stock_threshold, expiry_date, image, description.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose CSV File
                </Button>
              </div>

              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />

              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Processing CSV...</span>
                </div>
              )}
            </>
          )}

          {showPreview && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {validCount} Valid
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errorCount} Errors
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false)
                    setParsedProducts([])
                    setCsvData("")
                  }}
                >
                  Upload Different File
                </Button>
              </div>

              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {product.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name || "N/A"}</TableCell>
                        <TableCell>{product.category || "N/A"}</TableCell>
                        <TableCell>{product.price ? `₦${product.price.toFixed(2)}` : "N/A"}</TableCell>
                        <TableCell>{product.stock || 0}</TableCell>
                        <TableCell>
                          {product.errors.length > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">{product.errors.join(", ")}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {errorCount > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {errorCount} products have errors and will be skipped. Only {validCount} valid products will be
                    imported.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {showPreview && (
            <Button onClick={handleImport} disabled={validCount === 0}>
              Import {validCount} Products
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
