"use client"

import { useEffect, useRef } from "react"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeGenerator({ value, size = 200, className }: QRCodeGeneratorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"
    script.onload = () => {
      generateQRCode()
    }
    document.head.appendChild(script)

    const generateQRCode = () => {
      if (containerRef.current && (window as any).qrcode) {
        // Clear previous QR code
        containerRef.current.innerHTML = ""

        try {
          const qr = (window as any).qrcode(0, "M")
          qr.addData(value)
          qr.make()

          // Create QR code as SVG for better quality
          const qrSvg = qr.createSvgTag({
            cellSize: Math.floor(size / 25),
            margin: 4,
            scalable: true,
          })

          containerRef.current.innerHTML = qrSvg

          // Style the SVG
          const svg = containerRef.current.querySelector("svg")
          if (svg) {
            svg.style.width = `${size}px`
            svg.style.height = `${size}px`
            svg.style.display = "block"
          }
        } catch (error) {
          console.error("Error generating QR code:", error)
          // Fallback to canvas-based generation
          generateCanvasQRCode()
        }
      }
    }

    const generateCanvasQRCode = () => {
      if (!containerRef.current) return

      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      containerRef.current.appendChild(canvas)

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Simple fallback QR code pattern
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = "black"

      // Create a basic pattern that represents the URL
      const moduleSize = size / 25
      for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
          if ((i + j) % 3 === 0 || i === 0 || i === 24 || j === 0 || j === 24) {
            ctx.fillRect(j * moduleSize, i * moduleSize, moduleSize, moduleSize)
          }
        }
      }
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [value, size])

  return <div ref={containerRef} className={className} />
}
