"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { User, ShoppingCart, Package, UserCheck, Calendar, Filter, Download, RefreshCw } from "lucide-react"
import { getAuditTrail } from "@/lib/audit-logger"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface AuditEntry {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: string
  action: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
  details: any
  ip_address?: string
}

export function AuditTrail() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const loadAuditTrail = async () => {
    try {
      setIsLoading(true)
      const auditData = await getAuditTrail()
      setAuditEntries(auditData)
      setFilteredEntries(auditData)
    } catch (error) {
      console.error("Error loading audit trail:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load audit trail",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAuditTrail()

    const supabase = createClient()
    const subscription = supabase
      .channel("audit_trail_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_trail",
        },
        (payload) => {
          console.log("New audit entry:", payload.new)
          setAuditEntries((prev) => [payload.new as AuditEntry, ...prev])
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let filtered = [...auditEntries]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(query) ||
          entry.action.toLowerCase().includes(query) ||
          JSON.stringify(entry.details).toLowerCase().includes(query),
      )
    }

    // Apply action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((entry) => entry.action === actionFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((entry) => new Date(entry.timestamp) >= filterDate)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredEntries(filtered)
  }, [auditEntries, searchQuery, actionFilter, dateFilter])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
        return <UserCheck className="h-4 w-4" />
      case "sale":
        return <ShoppingCart className="h-4 w-4" />
      case "inventory_add":
      case "inventory_edit":
      case "stock_adjustment":
        return <Package className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      login: "outline",
      sale: "default",
      inventory_add: "secondary",
      inventory_edit: "secondary",
      stock_adjustment: "secondary",
    }

    const labels: Record<string, string> = {
      login: "Login",
      sale: "Sale",
      inventory_add: "Add Product",
      inventory_edit: "Edit Product",
      stock_adjustment: "Stock Adjustment",
    }

    return <Badge variant={variants[action] || "outline"}>{labels[action] || action}</Badge>
  }

  const getActionDetails = (entry: AuditEntry) => {
    switch (entry.action) {
      case "login":
        return `User logged in from ${entry.details.ipAddress || "unknown IP"}`
      case "sale":
        return `Sale completed: ₦${entry.details.total?.toFixed(2)} (${entry.details.itemCount} items)`
      case "inventory_add":
        return `Added product: ${entry.details.productName} (${entry.details.stock} units)`
      case "inventory_edit":
        return `Updated product: ${entry.details.productName}`
      case "stock_adjustment":
        return `Adjusted stock: ${entry.details.productName} (${entry.details.quantity > 0 ? "+" : ""}${entry.details.quantity})`
      default:
        return "Unknown action"
    }
  }

  const exportAuditTrail = () => {
    const csvContent = [
      ["Timestamp", "User", "Role", "Action", "Details"].join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.timestamp,
          entry.user_name,
          entry.user_role,
          entry.action,
          `"${getActionDetails(entry).replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Track all user activities and system changes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAuditTrail} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportAuditTrail}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by user, action, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="inventory_add">Add Products</SelectItem>
              <SelectItem value="inventory_edit">Edit Products</SelectItem>
              <SelectItem value="stock_adjustment">Stock Adjustments</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Audit Trail Table */}
        {!isLoading && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No audit entries found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{formatTimestamp(entry.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{entry.user_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{entry.user_role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(entry.action)}
                          {getActionBadge(entry.action)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{getActionDetails(entry)}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && filteredEntries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredEntries.filter((e) => e.action === "login").length}</p>
              <p className="text-xs text-muted-foreground">Logins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredEntries.filter((e) => e.action === "sale").length}</p>
              <p className="text-xs text-muted-foreground">Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {filteredEntries.filter((e) => e.action.includes("inventory")).length}
              </p>
              <p className="text-xs text-muted-foreground">Inventory Changes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{new Set(filteredEntries.map((e) => e.user_id)).size}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
