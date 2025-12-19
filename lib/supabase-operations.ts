// Re-export from database adapter which automatically switches between Supabase and SQLite
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getWholesalers,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
  getSales,
  createSale,
  getStockAdjustments,
  createStockAdjustment,
  getCurrentUser,
  updateProductStock,
  updateProductStocks,
  isAdmin,
  getTodaysRevenue,
} from './database-adapter'

// Keep types for backward compatibility
import type { Database } from "@/lib/supabase/database.types"

export type Product = Database["public"]["Tables"]["products"]["Row"]
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"]
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"]

export type Wholesaler = Database["public"]["Tables"]["wholesalers"]["Row"]
export type WholesalerInsert = Database["public"]["Tables"]["wholesalers"]["Insert"]
export type WholesalerUpdate = Database["public"]["Tables"]["wholesalers"]["Update"]

export type Sale = Database["public"]["Tables"]["sales"]["Row"]
export type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"]

export type StockAdjustment = Database["public"]["Tables"]["stock_adjustments"]["Row"]
export type StockAdjustmentInsert = Database["public"]["Tables"]["stock_adjustments"]["Insert"]

export type User = Database["public"]["Tables"]["users"]["Row"]
