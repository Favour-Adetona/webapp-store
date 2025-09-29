"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Calendar, User, ReceiptIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PublicReceiptProps {
  saleId: string
}

export function PublicReceipt({ saleId }: PublicReceiptProps) {
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data: saleData, error } = await supabase.from("sales").select("*").eq("id", saleId).single()

        if (error) {
          console.error("Error fetching sale:", error)
          setSale(null)
        } else {
          setSale(saleData)
        }
      } catch (error) {
        console.error("Error:", error)
        setSale(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSale()
  }, [saleId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Receipt Not Found</h2>
            <p className="text-muted-foreground">
              The receipt you're looking for doesn't exist or may have been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">RETAIL OPERATIONS</CardTitle>
            <p className="text-muted-foreground">Digital Purchase Receipt</p>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Receipt Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Receipt #</p>
                  <p className="font-medium">{sale.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(sale.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-medium">{sale.user_name}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Items Purchased */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Items Purchased
              </h3>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.packaging}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₦{item.price.toFixed(2)}</TableCell>
                        <TableCell>₦{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₦{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount ({sale.discount}%):</span>
                  <span className="text-green-600">-₦{sale.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid:</span>
                <span>₦{sale.total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Thank you for shopping with us!</p>
              <p>This is a digital receipt. Please save or screenshot for your records.</p>
              <p className="text-xs">Generated on {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
