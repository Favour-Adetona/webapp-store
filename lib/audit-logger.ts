import { getCurrentUser } from "@/lib/supabase-operations"
import { createAuditEntry } from "@/lib/database-adapter"
import { isElectron } from "@/lib/utils"

interface AuditEntry {
  id?: string
  timestamp?: string
  user_id: string | null
  user_name: string
  user_role: string
  action: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
  details: any
  ip_address?: string | null
}

export async function logAuditEvent(
  action: AuditEntry["action"],
  details: any,
  customUser?: { id: string; name: string; role: string },
) {
  try {
    const user = customUser || (await getCurrentUser())
    if (!user) return

    const auditEntry: Omit<AuditEntry, "id" | "timestamp" | "created_at"> = {
      user_id: user.id,
      user_name: user.name || user.username,
      user_role: user.role,
      action,
      details,
      ip_address: getClientIP(),
    }

    if (isElectron()) {
      // Use SQLite via adapter
      await createAuditEntry(auditEntry)
    } else {
      // Use Supabase for web
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.from("audit_trail").insert(auditEntry)

      if (error) {
        console.error("Error logging audit event:", error)
      }
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error)
  }
}

function getClientIP(): string {
  // In a real application, you would get this from the server
  // For demo purposes, we'll use a placeholder
  return "127.0.0.1"
}

// Specific logging functions for different actions
export async function logLogin(user: { id: string; name: string; role: string }) {
  await logAuditEvent(
    "login",
    {
      ipAddress: getClientIP(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    },
    user,
  )
}

export async function logSale(saleData: any) {
  await logAuditEvent("sale", {
    saleId: saleData.id,
    total: saleData.total,
    itemCount: Array.isArray(saleData.items) ? saleData.items.length : 0,
    items: Array.isArray(saleData.items)
      ? saleData.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      : [],
  })
}

export async function logInventoryAdd(productData: any) {
  await logAuditEvent("inventory_add", {
    productId: productData.id,
    productName: productData.name,
    category: productData.category,
    price: productData.price,
    stock: productData.stock,
  })
}

export async function logInventoryEdit(productData: any, changes: any) {
  await logAuditEvent("inventory_edit", {
    productId: productData.id,
    productName: productData.name,
    changes,
  })
}

export async function logStockAdjustment(adjustmentData: any) {
  await logAuditEvent("stock_adjustment", {
    productId: adjustmentData.productId,
    productName: adjustmentData.productName,
    quantity: adjustmentData.quantity,
    reason: adjustmentData.reason,
  })
}

export async function getAuditTrail(): Promise<AuditEntry[]> {
  try {
    if (isElectron()) {
      // Use SQLite via adapter
      const { getAuditTrail: getTrail } = await import('@/lib/database-adapter')
      return await getTrail()
    } else {
      // Use Supabase for web
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from("audit_trail")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1000) // Limit to last 1000 entries for performance

      if (error) {
        console.error("Error fetching audit trail:", error)
        return []
      }

      return data || []
    }
  } catch (error) {
    console.error("Error in getAuditTrail:", error)
    return []
  }
}
