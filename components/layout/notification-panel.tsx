"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getCurrentUser, getProducts, getWholesalers } from "@/lib/supabase-operations"

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true)

        const user = await getCurrentUser()
        const userIsAdmin = user?.role === "admin"
        setIsAdmin(userIsAdmin)

        const products = await getProducts()
        const wholesalers = userIsAdmin ? await getWholesalers() : []

        const allNotifications: any[] = []

        if (products && Array.isArray(products)) {
          const today = new Date()

          // --- Out of stock ---
          products
            .filter((p: any) => p.stock === 0)
            .forEach((product: any) => {
              allNotifications.push({
                type: "outOfStock",
                title: `${product.name} is out of stock`,
                severity: "high",
                link: "/inventory",
              })
            })

          // --- Low stock ---
          products
            .filter(
              (p: any) => p.stock > 0 && p.stock <= p.low_stock_threshold,
            )
            .forEach((product: any) => {
              allNotifications.push({
                type: "lowStock",
                title: `${product.name} is running low (${product.stock} left)`,
                severity: "medium",
                link: "/inventory",
              })
            })

          // --- Expiring products (20-day threshold) ---
          const thresholdDays = 20
          const thresholdDate = new Date()
          thresholdDate.setDate(today.getDate() + thresholdDays)

          products
            .filter((p: any) => p.expiry_date)
            .filter((p: any) => new Date(p.expiry_date) <= thresholdDate)
            .forEach((product: any) => {
              const expiryDate = new Date(product.expiry_date)
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              )

              allNotifications.push({
                type: "expiring",
                title: `${product.name} expires in ${daysUntilExpiry} days`,
                severity: daysUntilExpiry <= 7 ? "high" : "medium",
                link: "/inventory",
              })
            })
        }

        if (userIsAdmin && wholesalers && Array.isArray(wholesalers)) {
          wholesalers.forEach((wholesaler: any) => {
            if (!wholesaler.expected_delivery) return

            const deliveryDate = new Date(wholesaler.expected_delivery)
            const daysUntilDelivery = Math.ceil(
              (deliveryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            )

            if (deliveryDate < new Date()) {
              allNotifications.push({
                type: "delivery",
                title: `Overdue delivery from ${wholesaler.name}`,
                severity: "high",
                link: "/wholesalers",
              })
            } else if (daysUntilDelivery <= 7) {
              allNotifications.push({
                type: "delivery",
                title: `Delivery from ${wholesaler.name} in ${daysUntilDelivery} days`,
                severity: "low",
                link: "/wholesalers",
              })
            }
          })
        }

        setNotifications(allNotifications)
        setNotificationCount(allNotifications.length)
      } catch (error) {
        console.error("Error loading notifications:", error)
        setNotifications([])
        setNotificationCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Notifications</h4>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <Link
                    key={index}
                    href={notification.link}
                    className={cn(
                      "block rounded-md p-2 text-xs hover:bg-accent",
                      notification.severity === "high"
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : notification.severity === "medium"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{notification.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
