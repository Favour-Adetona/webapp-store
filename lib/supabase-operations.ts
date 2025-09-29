import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"]
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"]

type Wholesaler = Database["public"]["Tables"]["wholesalers"]["Row"]
type WholesalerInsert = Database["public"]["Tables"]["wholesalers"]["Insert"]
type WholesalerUpdate = Database["public"]["Tables"]["wholesalers"]["Update"]

type Sale = Database["public"]["Tables"]["sales"]["Row"]
type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"]

type StockAdjustment = Database["public"]["Tables"]["stock_adjustments"]["Row"]
type StockAdjustmentInsert = Database["public"]["Tables"]["stock_adjustments"]["Insert"]

type User = Database["public"]["Tables"]["users"]["Row"]

/* ---------------------- Product Operations ---------------------- */
export async function getProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return (
    data?.map((p) => ({
      ...p,
      expiryDate: p.expiry_date ? new Date(p.expiry_date).toISOString().split("T")[0] : "",
    })) || []
  )
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return data
    ? { ...data, expiryDate: data.expiry_date ? new Date(data.expiry_date).toISOString().split("T")[0] : "" }
    : null
}

export async function createProduct(
  product: Omit<ProductInsert, "id" | "created_at" | "updated_at" | "created_by">,
): Promise<Product | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const productData = {
    name: product.name,
    category: product.category || "General",
    packaging: product.packaging || "Unit",
    price: product.price,
    stock: product.stock || 0,
    low_stock_threshold: product.low_stock_threshold || 5,
    expiry_date: product.expiryDate ? new Date(product.expiryDate).toISOString() : null,
    image: product.image || "/placeholder.svg?height=100&width=100",
    created_by: user.id,
  }

  const { data, error } = await supabase.from("products").insert(productData).select().single()

  if (error) {
    console.error("Error creating product:", error)
    throw error
  }

  return data
}

export async function updateProduct(id: string, updates: ProductUpdate): Promise<Product | null> {
  const supabase = createClient()

  console.log("[v0] Updating product with data:", updates)

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
    // Handle both expiryDate and expiry_date field names
    expiry_date: updates.expiryDate
      ? new Date(updates.expiryDate).toISOString()
      : updates.expiry_date
        ? new Date(updates.expiry_date).toISOString()
        : null,
  }

  // Remove expiryDate if it exists since we're using expiry_date
  delete updateData.expiryDate

  const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Error updating product:", error)
    throw error
  }

  console.log("[v0] Product updated successfully:", data)
  return data
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) {
    console.error("Error deleting product:", error)
    return false
  }
  return true
}

/* ---------------------- Wholesaler Operations ---------------------- */
export async function getWholesalers(): Promise<Wholesaler[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("wholesalers")
    .select("id, name, contact, phone, products, capital_spent, expected_delivery, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wholesalers:", error)
    return []
  }

  return (
    data?.map((w) => ({
      ...w,
      expectedDelivery: w.expected_delivery ? new Date(w.expected_delivery).toISOString().split("T")[0] : "",
    })) || []
  )
}

export async function createWholesaler(
  wholesaler: Omit<WholesalerInsert, "id" | "created_at" | "updated_at" | "created_by">,
): Promise<Wholesaler | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const wholesalerData = {
    name: wholesaler.name,
    contact: wholesaler.contact,
    phone: wholesaler.phone || "",
    products: wholesaler.products || [],
    expected_delivery: wholesaler.expectedDelivery ? new Date(wholesaler.expectedDelivery).toISOString() : null,
    capital_spent: wholesaler.capital_spent || 0,
    created_by: user.id,
  }

  console.log("[v0] Creating wholesaler with data:", wholesalerData)

  const { data, error } = await supabase.from("wholesalers").insert(wholesalerData).select().single()
  if (error) {
    console.error("Error creating wholesaler:", error)
    throw error
  }
  return data
}

export async function updateWholesaler(id: string, updates: WholesalerUpdate): Promise<Wholesaler | null> {
  const supabase = createClient()

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
    expected_delivery: updates.expectedDelivery
      ? new Date(updates.expectedDelivery).toISOString()
      : updates.expected_delivery,
  }

  // Remove expectedDelivery if it exists since we're using expected_delivery
  delete updateData.expectedDelivery

  const { data, error } = await supabase.from("wholesalers").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating wholesaler:", error)
    throw error
  }

  return data
}

export async function deleteWholesaler(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("wholesalers").delete().eq("id", id)
  if (error) {
    console.error("Error deleting wholesaler:", error)
    return false
  }
  return true
}

/* ---------------------- Sales Operations ---------------------- */
/* ---------------------- Sales Operations ---------------------- */
export async function getSales(): Promise<Sale[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching sales:", error)
    return []
  }

  return data || []
}

export async function createSale(sale: Omit<SaleInsert, "id" | "created_at" | "user_id">): Promise<Sale | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data: userProfile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single()

  const saleData = {
    ...sale,
    user_id: user.id,
    cashier_name: userProfile?.name || "Unknown", // Use cashier_name for the new column
  }

  const { data, error } = await supabase
    .from("sales")
    .insert(saleData)
    .select()
    .single()

  if (error) {
    console.error("Error creating sale:", error)
    throw error
  }

  return data
}

/* ---------------------- Stock Adjustment Operations ---------------------- */
export async function getStockAdjustments(): Promise<StockAdjustment[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("stock_adjustments").select("*").order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching stock adjustments:", error)
    return []
  }
  return data || []
}

export async function createStockAdjustment(
  adjustment: Omit<StockAdjustmentInsert, "id" | "created_at" | "created_by">,
): Promise<StockAdjustment | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("stock_adjustments")
    .insert({ ...adjustment, created_by: user.id })
    .select()
    .single()

  if (error) {
    console.error("Error creating stock adjustment:", error)
    throw error
  }

  return data
}

/* ---------------------- User Operations ---------------------- */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id)
  if (!userProfile || userProfile.length === 0) return null
  if (userProfile.length > 1) console.warn("Multiple user profiles found, using first one")

  return userProfile[0]
}

/* ---------------------- Utility Operations ---------------------- */
export async function updateProductStock(productId: string, quantityChange: number): Promise<boolean> {
  const supabase = createClient()
  const product = await getProductById(productId)
  if (!product) return false

  const newStock = product.stock + quantityChange
  if (newStock < 0) return false

  const { error } = await supabase
    .from("products")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId)

  if (error) {
    console.error("Error updating product stock:", error)
    return false
  }

  return true
}

export async function updateProductStocks(updates: { productId: string; quantityChange: number }[]): Promise<boolean> {
  try {
    const results = await Promise.all(updates.map((u) => updateProductStock(u.productId, u.quantityChange)))
    return results.every((res) => res)
  } catch (error) {
    console.error("Error updating product stocks:", error)
    return false
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

/* ---------------------- Today's Revenue ---------------------- */
export async function getTodaysRevenue(): Promise<number> {
  const supabase = createClient()

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const { data, error } = await supabase
    .from("sales")
    .select("total")
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())

  if (error) {
    console.error("Error fetching today's revenue:", error)
    return 0
  }

  return data?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
}
