"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, Scan } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface QRScannerProps {
  products: any[]
  onProductScanned: (product: any) => void
  onClose: () => void
}

function detectQRCode(canvas: HTMLCanvasElement, video: HTMLVideoElement): string | null {
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Use jsQR library for proper QR code detection
  if (typeof window !== "undefined" && (window as any).jsQR) {
    const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code) {
      return code.data
    }
  }

  return null
}

export function QRScanner({ products, onProductScanned, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<any>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [jsQRLoaded, setJsQRLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"
    script.onload = () => setJsQRLoaded(true)
    script.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error loading QR scanner",
        description: "Failed to load QR code scanning library",
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [toast])

  const scanForQR = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !jsQRLoaded) return

    const qrData = detectQRCode(canvasRef.current, videoRef.current)

    if (qrData) {
      const foundProduct = products.find((p) => {
        // Try to match by product ID, name, or barcode
        return (
          p.id.toString() === qrData ||
          p.name.toLowerCase().includes(qrData.toLowerCase()) ||
          p.barcode === qrData ||
          qrData.includes(p.id.toString())
        )
      })

      if (foundProduct && foundProduct.stock > 0) {
        setScannedProduct(foundProduct)
        setIsScanning(false)
        stopCamera()
        toast({
          title: "QR Code detected!",
          description: `Found: ${foundProduct.name}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Product not found",
          description: `No product found for QR code: ${qrData}`,
        })
      }
    }
  }

  const startCamera = async () => {
    if (!jsQRLoaded) {
      toast({
        variant: "destructive",
        title: "QR Scanner not ready",
        description: "Please wait for the QR scanner to load",
      })
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          scanIntervalRef.current = setInterval(scanForQR, 500) // Scan every 500ms
        }
      }
      setIsScanning(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes. HTTPS required for camera access.",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }

  const manualScan = () => {
    scanForQR()
    if (!scannedProduct) {
      toast({
        title: "Scanning...",
        description: "Hold steady and ensure QR code is visible and well-lit",
      })
    }
  }

  const handleAddProduct = () => {
    if (scannedProduct) {
      onProductScanned(scannedProduct)
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isScanning && !scannedProduct && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Scan a product QR code to quickly add it to your sale
              </p>
              <Button onClick={startCamera} className="w-full" disabled={!jsQRLoaded}>
                <Camera className="mr-2 h-4 w-4" />
                {jsQRLoaded ? "Start Camera" : "Loading QR Scanner..."}
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 sm:h-64 bg-black rounded-lg object-cover"
                />
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">Scanning for QR codes...</div>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button onClick={manualScan} className="flex-1">
                  <Scan className="mr-2 h-4 w-4" />
                  Manual Scan
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Point camera at QR code. Scanning automatically every 0.5 seconds. For best results, ensure good
                lighting and steady hands.
              </p>
            </div>
          )}

          {scannedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <img
                      src={scannedProduct.image || "/placeholder.svg?height=64&width=64"}
                      alt={scannedProduct.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{scannedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{scannedProduct.category}</p>
                    <p className="text-sm text-muted-foreground truncate">{scannedProduct.packaging}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">₦{scannedProduct.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <p className="font-medium">{scannedProduct.stock} units</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiry:</span>
                    <p className="font-medium">{new Date(scannedProduct.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{scannedProduct.category}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button onClick={handleAddProduct} className="flex-1">
                    Add to Sale
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScannedProduct(null)
                      startCamera()
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Scan Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
