import { isElectron } from './utils'

// Import Supabase operations implementation (not the re-export file)
import * as supabaseOps from './supabase-operations-impl'

// Import SQLite operations (will be loaded dynamically in Electron)
let sqliteOps: typeof supabaseOps | null = null

/**
 * Dynamically load SQLite operations only when in Electron
 */
async function getSqliteOperations() {
  if (!sqliteOps && typeof window !== 'undefined' && isElectron()) {
    try {
      // Use a variable to make the import path less statically analyzable by webpack
      // This helps prevent webpack from trying to bundle better-sqlite3 in web builds
      const sqlitePath = './sqlite/operations'
      sqliteOps = await import(sqlitePath)
    } catch (error) {
      console.error('Failed to load SQLite operations:', error)
      // If SQLite fails to load, we'll fall back to Supabase
    }
  }
  return sqliteOps
}

/**
 * Database adapter that switches between Supabase and SQLite based on environment
 */
export async function useDatabase() {
  if (typeof window === 'undefined') {
    // Server-side: always use Supabase
    return supabaseOps
  }

  if (isElectron()) {
    // Electron: use SQLite
    const ops = await getSqliteOperations()
    return ops || supabaseOps // Fallback to Supabase if SQLite fails
  }

  // Web: use Supabase
  return supabaseOps
}

// Re-export all operations with automatic adapter
export const getProducts = async () => {
  const ops = await useDatabase()
  return ops.getProducts()
}

export const getProductById = async (id: string) => {
  const ops = await useDatabase()
  return ops.getProductById(id)
}

export const createProduct = async (
  product: Parameters<typeof supabaseOps.createProduct>[0]
) => {
  const ops = await useDatabase()
  return ops.createProduct(product)
}

export const updateProduct = async (
  id: string,
  updates: Parameters<typeof supabaseOps.updateProduct>[1]
) => {
  const ops = await useDatabase()
  return ops.updateProduct(id, updates)
}

export const deleteProduct = async (id: string) => {
  const ops = await useDatabase()
  return ops.deleteProduct(id)
}

export const getWholesalers = async () => {
  const ops = await useDatabase()
  return ops.getWholesalers()
}

export const createWholesaler = async (
  wholesaler: Parameters<typeof supabaseOps.createWholesaler>[0]
) => {
  const ops = await useDatabase()
  return ops.createWholesaler(wholesaler)
}

export const updateWholesaler = async (
  id: string,
  updates: Parameters<typeof supabaseOps.updateWholesaler>[1]
) => {
  const ops = await useDatabase()
  return ops.updateWholesaler(id, updates)
}

export const deleteWholesaler = async (id: string) => {
  const ops = await useDatabase()
  return ops.deleteWholesaler(id)
}

export const getSales = async () => {
  const ops = await useDatabase()
  return ops.getSales()
}

export const createSale = async (
  sale: Parameters<typeof supabaseOps.createSale>[0]
) => {
  const ops = await useDatabase()
  return ops.createSale(sale)
}

export const getStockAdjustments = async () => {
  const ops = await useDatabase()
  return ops.getStockAdjustments()
}

export const createStockAdjustment = async (
  adjustment: Parameters<typeof supabaseOps.createStockAdjustment>[0]
) => {
  const ops = await useDatabase()
  return ops.createStockAdjustment(adjustment)
}

export const getCurrentUser = async () => {
  const ops = await useDatabase()
  return ops.getCurrentUser()
}

export const updateProductStock = async (productId: string, quantityChange: number) => {
  const ops = await useDatabase()
  return ops.updateProductStock(productId, quantityChange)
}

export const updateProductStocks = async (
  updates: Parameters<typeof supabaseOps.updateProductStocks>[0]
) => {
  const ops = await useDatabase()
  return ops.updateProductStocks(updates)
}

export const isAdmin = async () => {
  const ops = await useDatabase()
  return ops.isAdmin()
}

export const getTodaysRevenue = async () => {
  const ops = await useDatabase()
  return ops.getTodaysRevenue()
}

// Audit trail operations (only available in SQLite, Supabase uses direct client)
export const createAuditEntry = async (entry: any) => {
  const ops = await useDatabase()
  if ('createAuditEntry' in ops) {
    return (ops as any).createAuditEntry(entry)
  }
  // Fallback to Supabase for web
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()
  const { error } = await supabase.from('audit_trail').insert(entry)
  return !error
}

export const getAuditTrail = async () => {
  const ops = await useDatabase()
  if ('getAuditTrail' in ops) {
    return (ops as any).getAuditTrail()
  }
  // Fallback to Supabase for web
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()
  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1000)
  return data || []
}

