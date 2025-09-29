"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { QRCodeGenerator } from "@/components/sales/qr-code-generator"
import { Share2, Download } from "lucide-react"

interface ReceiptProps {
  sale: any
  onClose: () => void
}

export function Receipt({ sale, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const receiptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/receipt/${sale.id}`

  const formatDate = (dateString?: string | null) => {
    const date = new Date(dateString || sale.created_at)
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
  }

  // Print with CSS included
  const handlePrint = () => {
    if (!receiptRef.current) return
    const printContents = receiptRef.current.innerHTML

    // collect all CSS
    const styles = Array.from(document.styleSheets)
      .map((ss: any) => {
        try {
          return Array.from(ss.cssRules)
            .map((rule: any) => rule.cssText)
            .join('')
        } catch {
          return ''
        }
      })
      .join('')

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>${styles}</style>
          <style>
            /* extra print tweaks */
            .packaging { font-size:11px; font-style:italic; text-transform:lowercase; color:#555 }
            .totals-label { font-weight:bold }
            .section-spacing { margin-top:16px }
          </style>
        </head>
        <body class="p-6 font-sans">${printContents}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()

    setTimeout(() =>
      toast({ title: "Receipt printed", description: "The receipt has been sent to your printer." }), 500)
  }

  const handleShareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${sale.id}`,
          text: "View your receipt",
          url: receiptUrl,
        })
      } catch {
        navigator.clipboard
          .writeText(receiptUrl)
          .then(() => toast({ title: "Receipt URL copied", description: "Link copied to clipboard" }))
      }
    } else {
      navigator.clipboard
        .writeText(receiptUrl)
        .then(() => toast({ title: "Receipt URL copied", description: "Link copied to clipboard" }))
    }
  }

  const downloadQRCode = () => {
    if (!qrContainerRef.current) return

    const svg = qrContainerRef.current.querySelector("svg")
    if (svg) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = 200
      canvas.height = 200
      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(svgBlob)
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const link = document.createElement("a")
        link.download = `receipt-qr-${sale.id}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
        URL.revokeObjectURL(url)
        toast({ title: "QR Code downloaded", description: "Saved to your device" })
      }
      img.src = url
      return
    }

    const canvas = qrContainerRef.current.querySelector("canvas")
    if (canvas) {
      const link = document.createElement("a")
      link.download = `receipt-qr-${sale.id}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast({ title: "QR Code downloaded", description: "Saved to your device" })
    } else {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "QR code not ready for download",
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt & QR Code</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Receipt content */}
          <div ref={receiptRef} className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">A1 PHARMACY AND STORES LTD</h3>
              <p className="text-sm text-muted-foreground">Digital Receipt</p>
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-bold">Receipt #:</span>
                <span>{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Date:</span>
                <span>{formatDate(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Cashier:</span>
                <span>{sale.user_name}</span>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item: any, index: number) => (
                    <TableRow key={index} className="border-b border-dashed">
                      <TableCell>
                        <div className="font-semibold">{item.name}</div>
                        <div className="packaging">{item.packaging}</div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₦{item.price.toFixed(2)}</TableCell>
                      <TableCell>₦{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="text-right space-y-1 mt-4">
              <div className="text-sm">
                <span className="totals-label">Subtotal:</span> ₦{sale.subtotal.toFixed(2)}
              </div>
              {sale.discount > 0 && (
                <div className="text-sm">
                  Discount ({sale.discount}%): ₦{sale.discount_amount.toFixed(2)}
                </div>
              )}
              <div className="text-lg font-bold">
                <span className="totals-label">Total:</span> ₦{sale.total.toFixed(2)}
              </div>
            </div>

            <Separator className="my-2" />
            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your purchase!</p>
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center space-y-4">
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Digital Receipt</CardTitle>
                <p className="text-sm text-muted-foreground">Scan to view receipt online</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border" ref={qrContainerRef}>
                  <QRCodeGenerator value={receiptUrl} size={180} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Scan this QR code with any device</p>
                  <p className="text-xs font-mono text-blue-600 break-all px-2">{receiptUrl}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShareReceipt}>
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadQRCode}>
                      <Download className="h-3 w-3 mr-1" />
                      Save QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>Print Receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
