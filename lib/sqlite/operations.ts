// Import database functions (they handle Node.js module loading internally)
import { getDatabase, generateUUID } from './database'
import type { Database } from '@/lib/supabase/database.types'

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

/**
 * Helper to get current user from Supabase auth (still using Supabase for auth)
 * This will be called from the renderer process
 */
async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    // Import Supabase client dynamically to avoid issues in Electron
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Sync user profile from Supabase to SQLite
 */
async function syncUserFromSupabase(userId: string): Promise<User | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !userProfile) {
      console.error('Error fetching user from Supabase:', error)
      return null
    }

    // Insert or update user in SQLite
    const db = getDatabase()
    const now = new Date().toISOString()
    
    // Check if user exists
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userProfile.id) as User | undefined
    
    if (existing) {
      // Update existing user
      const updateStmt = db.prepare(`
        UPDATE users 
        SET username = ?, name = ?, role = ?, updated_at = ?
        WHERE id = ?
      `)
      updateStmt.run(
        userProfile.username,
        userProfile.name,
        userProfile.role,
        now,
        userProfile.id
      )
    } else {
      // Insert new user
      const insertStmt = db.prepare(`
        INSERT INTO users (id, username, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      insertStmt.run(
        userProfile.id,
        userProfile.username,
        userProfile.name,
        userProfile.role,
        userProfile.created_at || now,
        now
      )
    }

    return userProfile as User
  } catch (error) {
    console.error('Error syncing user from Supabase:', error)
    return null
  }
}

/**
 * Helper to get current user profile (syncs from Supabase if needed)
 */
async function getCurrentUserProfile(): Promise<User | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const db = getDatabase()
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined
  
  // If user not found in SQLite, sync from Supabase
  if (!user) {
    user = await syncUserFromSupabase(userId) || undefined
  }
  
  return user || null
}

/* ---------------------- Product Operations ---------------------- */
export async function getProducts(): Promise<Product[]> {
  const db = getDatabase()
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[]

  return products.map((p) => ({
    ...p,
    expiryDate: p.expiry_date ? new Date(p.expiry_date).toISOString().split('T')[0] : '',
    expiry_date: p.expiry_date,
    price: Number(p.price),
    stock: Number(p.stock),
    low_stock_threshold: Number(p.low_stock_threshold),
  })) as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = getDatabase()
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any

  if (!product) return null

  return {
    ...product,
    expiryDate: product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : '',
    expiry_date: product.expiry_date,
    price: Number(product.price),
    stock: Number(product.stock),
    low_stock_threshold: Number(product.low_stock_threshold),
  } as Product
}

export async function createProduct(
  product: Omit<ProductInsert, "id" | "created_at" | "updated_at" | "created_by">,
): Promise<Product | null> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("User not authenticated")

  const db = getDatabase()
  const id = generateUUID()
  const now = new Date().toISOString()

  const productData = {
    id,
    name: product.name,
    category: product.category || "General",
    packaging: product.packaging || "Unit",
    price: product.price,
    stock: product.stock || 0,
    low_stock_threshold: product.low_stock_threshold || 5,
    expiry_date: product.expiry_date ? new Date(product.expiry_date).toISOString() : null,
    image: product.image || "/placeholder.svg?height=100&width=100",
    created_by: userId,
    created_at: now,
    updated_at: now,
  }

  const stmt = db.prepare(`
    INSERT INTO products (id, name, category, packaging, price, stock, low_stock_threshold, expiry_date, image, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(
      productData.id,
      productData.name,
      productData.category,
      productData.packaging,
      productData.price,
      productData.stock,
      productData.low_stock_threshold,
      productData.expiry_date,
      productData.image,
      productData.created_by,
      productData.created_at,
      productData.updated_at
    )

    return await getProductById(id)
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(id: string, updates: ProductUpdate): Promise<Product | null> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const updateFields: string[] = []
  const updateValues: any[] = []

  if (updates.name !== undefined) {
    updateFields.push('name = ?')
    updateValues.push(updates.name)
  }
  if (updates.category !== undefined) {
    updateFields.push('category = ?')
    updateValues.push(updates.category)
  }
  if (updates.packaging !== undefined) {
    updateFields.push('packaging = ?')
    updateValues.push(updates.packaging)
  }
  if (updates.price !== undefined) {
    updateFields.push('price = ?')
    updateValues.push(updates.price)
  }
  if (updates.stock !== undefined) {
    updateFields.push('stock = ?')
    updateValues.push(updates.stock)
  }
  if (updates.low_stock_threshold !== undefined) {
    updateFields.push('low_stock_threshold = ?')
    updateValues.push(updates.low_stock_threshold)
  }
  if (updates.expiry_date !== undefined || (updates as any).expiryDate !== undefined) {
    const expiryDate = updates.expiry_date || (updates as any).expiryDate
    updateFields.push('expiry_date = ?')
    updateValues.push(expiryDate ? new Date(expiryDate).toISOString() : null)
  }
  if (updates.image !== undefined) {
    updateFields.push('image = ?')
    updateValues.push(updates.image)
  }

  updateFields.push('updated_at = ?')
  updateValues.push(now)
  updateValues.push(id)

  if (updateFields.length === 1) {
    // Only updated_at was added, no actual updates
    return await getProductById(id)
  }

  const stmt = db.prepare(`UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`)

  try {
    stmt.run(...updateValues)
    return await getProductById(id)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDatabase()
  try {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

/* ---------------------- Wholesaler Operations ---------------------- */
export async function getWholesalers(): Promise<Wholesaler[]> {
  const db = getDatabase()
  const wholesalers = db.prepare('SELECT * FROM wholesalers ORDER BY created_at DESC').all() as any[]

  return wholesalers.map((w) => {
    let products: string[] = []
    try {
      products = JSON.parse(w.products || '[]')
    } catch {
      products = []
    }

    return {
      ...w,
      products,
      expectedDelivery: w.expected_delivery ? new Date(w.expected_delivery).toISOString().split('T')[0] : '',
      expected_delivery: w.expected_delivery,
      capital_spent: Number(w.capital_spent),
    }
  }) as Wholesaler[]
}

export async function createWholesaler(
  wholesaler: Omit<WholesalerInsert, "id" | "created_at" | "updated_at" | "created_by">,
): Promise<Wholesaler | null> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("User not authenticated")

  const db = getDatabase()
  const id = generateUUID()
  const now = new Date().toISOString()

  const wholesalerData = {
    id,
    name: wholesaler.name,
    contact: wholesaler.contact,
    phone: wholesaler.phone || "",
    products: JSON.stringify(wholesaler.products || []),
    expected_delivery: wholesaler.expected_delivery ? new Date(wholesaler.expected_delivery).toISOString() : null,
    capital_spent: wholesaler.capital_spent || 0,
    created_by: userId,
    created_at: now,
    updated_at: now,
  }

  const stmt = db.prepare(`
    INSERT INTO wholesalers (id, name, contact, phone, products, expected_delivery, capital_spent, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(
      wholesalerData.id,
      wholesalerData.name,
      wholesalerData.contact,
      wholesalerData.phone,
      wholesalerData.products,
      wholesalerData.expected_delivery,
      wholesalerData.capital_spent,
      wholesalerData.created_by,
      wholesalerData.created_at,
      wholesalerData.updated_at
    )

    return await getWholesalers().then(w => w.find(w => w.id === id) || null)
  } catch (error) {
    console.error("Error creating wholesaler:", error)
    throw error
  }
}

export async function updateWholesaler(id: string, updates: WholesalerUpdate): Promise<Wholesaler | null> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const updateFields: string[] = []
  const updateValues: any[] = []

  if (updates.name !== undefined) {
    updateFields.push('name = ?')
    updateValues.push(updates.name)
  }
  if (updates.contact !== undefined) {
    updateFields.push('contact = ?')
    updateValues.push(updates.contact)
  }
  if (updates.phone !== undefined) {
    updateFields.push('phone = ?')
    updateValues.push(updates.phone)
  }
  if (updates.products !== undefined) {
    updateFields.push('products = ?')
    updateValues.push(JSON.stringify(updates.products))
  }
  if (updates.expected_delivery !== undefined || (updates as any).expectedDelivery !== undefined) {
    const expectedDelivery = updates.expected_delivery || (updates as any).expectedDelivery
    updateFields.push('expected_delivery = ?')
    updateValues.push(expectedDelivery ? new Date(expectedDelivery).toISOString() : null)
  }
  if (updates.capital_spent !== undefined) {
    updateFields.push('capital_spent = ?')
    updateValues.push(updates.capital_spent)
  }

  updateFields.push('updated_at = ?')
  updateValues.push(now)
  updateValues.push(id)

  if (updateFields.length === 1) {
    return await getWholesalers().then(w => w.find(w => w.id === id) || null)
  }

  const stmt = db.prepare(`UPDATE wholesalers SET ${updateFields.join(', ')} WHERE id = ?`)

  try {
    stmt.run(...updateValues)
    return await getWholesalers().then(w => w.find(w => w.id === id) || null)
  } catch (error) {
    console.error("Error updating wholesaler:", error)
    throw error
  }
}

export async function deleteWholesaler(id: string): Promise<boolean> {
  const db = getDatabase()
  try {
    const stmt = db.prepare('DELETE FROM wholesalers WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  } catch (error) {
    console.error("Error deleting wholesaler:", error)
    return false
  }
}

/* ---------------------- Sales Operations ---------------------- */
export async function getSales(): Promise<Sale[]> {
  const db = getDatabase()
  const sales = db.prepare('SELECT * FROM sales ORDER BY created_at DESC').all() as any[]

  return sales.map((s) => {
    let items: any = {}
    try {
      items = JSON.parse(s.items || '{}')
    } catch {
      items = {}
    }

    return {
      ...s,
      items,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      discount_amount: Number(s.discount_amount),
      total: Number(s.total),
    }
  }) as Sale[]
}

export async function createSale(sale: Omit<SaleInsert, "id" | "created_at" | "user_id">): Promise<Sale | null> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("User not authenticated")

  const userProfile = await getCurrentUserProfile()
  const db = getDatabase()
  const id = generateUUID()
  const now = new Date().toISOString()

  const saleData = {
    id,
    items: JSON.stringify(sale.items),
    subtotal: sale.subtotal,
    discount: sale.discount || 0,
    discount_amount: sale.discount_amount || 0,
    total: sale.total,
    user_id: userId,
    user_name: userProfile?.name || "Unknown",
    created_at: now,
  }

  const stmt = db.prepare(`
    INSERT INTO sales (id, items, subtotal, discount, discount_amount, total, user_id, user_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(
      saleData.id,
      saleData.items,
      saleData.subtotal,
      saleData.discount,
      saleData.discount_amount,
      saleData.total,
      saleData.user_id,
      saleData.user_name,
      saleData.created_at
    )

    return await getSales().then(s => s.find(s => s.id === id) || null)
  } catch (error) {
    console.error("Error creating sale:", error)
    throw error
  }
}

/* ---------------------- Stock Adjustment Operations ---------------------- */
export async function getStockAdjustments(): Promise<StockAdjustment[]> {
  const db = getDatabase()
  const adjustments = db.prepare('SELECT * FROM stock_adjustments ORDER BY created_at DESC').all() as any[]

  return adjustments.map((a) => ({
    ...a,
    quantity: Number(a.quantity),
  })) as StockAdjustment[]
}

export async function createStockAdjustment(
  adjustment: Omit<StockAdjustmentInsert, "id" | "created_at" | "created_by">,
): Promise<StockAdjustment | null> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("User not authenticated")

  const db = getDatabase()
  const id = generateUUID()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO stock_adjustments (id, product_id, product_name, quantity, reason, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(
      id,
      adjustment.product_id || null,
      adjustment.product_name,
      adjustment.quantity,
      adjustment.reason,
      userId,
      now
    )

    return await getStockAdjustments().then(a => a.find(a => a.id === id) || null)
  } catch (error) {
    console.error("Error creating stock adjustment:", error)
    throw error
  }
}

/* ---------------------- User Operations ---------------------- */
export async function getCurrentUser(): Promise<User | null> {
  return getCurrentUserProfile()
}

/* ---------------------- Utility Operations ---------------------- */
export async function updateProductStock(productId: string, quantityChange: number): Promise<boolean> {
  const product = await getProductById(productId)
  if (!product) return false

  const newStock = product.stock + quantityChange
  if (newStock < 0) return false

  try {
    await updateProduct(productId, { stock: newStock })
    return true
  } catch (error) {
    console.error("Error updating product stock:", error)
    return false
  }
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
  const db = getDatabase()
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  const sales = db.prepare(`
    SELECT total FROM sales 
    WHERE created_at >= ? AND created_at <= ?
  `).all(startOfDay, endOfDay) as { total: number }[]

  return sales.reduce((sum, s) => sum + (s.total || 0), 0)
}

/* ---------------------- Audit Trail Operations ---------------------- */
export interface AuditEntry {
  id?: string
  timestamp?: string
  user_id: string | null
  user_name: string
  user_role: string
  action: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
  details: any
  ip_address?: string | null
  created_at?: string
}

export async function createAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp" | "created_at">): Promise<boolean> {
  const db = getDatabase()
  const id = generateUUID()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO audit_trail (id, timestamp, user_id, user_name, user_role, action, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  try {
    stmt.run(
      id,
      now,
      entry.user_id || null,
      entry.user_name,
      entry.user_role,
      entry.action,
      JSON.stringify(entry.details),
      entry.ip_address || null,
      now
    )
    return true
  } catch (error) {
    console.error("Error creating audit entry:", error)
    return false
  }
}

export async function getAuditTrail(): Promise<AuditEntry[]> {
  const db = getDatabase()
  const entries = db.prepare('SELECT * FROM audit_trail ORDER BY timestamp DESC LIMIT 1000').all() as any[]

  return entries.map((e) => {
    let details: any = {}
    try {
      details = JSON.parse(e.details || '{}')
    } catch {
      details = {}
    }

    return {
      ...e,
      details,
    }
  }) as AuditEntry[]
}

