// Initial data for local storage
const initialUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin",
    role: "admin",
    name: "Admin User",
  },
  {
    id: 2,
    username: "staff",
    password: "staff",
    role: "staff",
    name: "Staff User",
  },
]

const initialProducts = [
  {
    id: 1,
    name: "Hand Sanitizer",
    category: "Liquids",
    packaging: "Bottles (Plastic)",
    price: 5000,
    stock: 50,
    lowStockThreshold: 10,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "Vitamin C",
    category: "Solids",
    packaging: "Tablets (strips)",
    price: 12000,
    stock: 30,
    lowStockThreshold: 5,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Moisturizing Cream",
    category: "Semi-Solids/Creams",
    packaging: "Tubes",
    price: 8500,
    stock: 25,
    lowStockThreshold: 5,
    expiryDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months from now
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    name: "Pain Relief Spray",
    category: "Sprays & Inhalables",
    packaging: "Aerosol Cans",
    price: 15000,
    stock: 15,
    lowStockThreshold: 3,
    expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months from now
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 5,
    name: "Eye Drops",
    category: "Drops & Applicators",
    packaging: "Droppers",
    price: 9000,
    stock: 8,
    lowStockThreshold: 10,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
    image: "/placeholder.svg?height=100&width=100",
  },
]

const initialWholesalers = [
  {
    id: 1,
    name: "MediSupply Inc.",
    contact: "contact@medisupply.com",
    phone: "123-456-7890",
    products: ["Hand Sanitizer", "Vitamin C"],
    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    capitalSpent: 250000,
  },
  {
    id: 2,
    name: "HealthGoods Distributors",
    contact: "orders@healthgoods.com",
    phone: "987-654-3210",
    products: ["Moisturizing Cream", "Pain Relief Spray"],
    expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    capitalSpent: 320000,
  },
]

const initialSales = []

const initialStockAdjustments = []

import {
  getCurrentUser as getCurrentUserSupabase,
  isAdmin as isAdminSupabase,
  getProducts,
  getWholesalers,
  getSales,
  getStockAdjustments,
} from "@/lib/supabase-operations"

// Helper functions for working with localStorage
export async function getFromLocalStorage(key: string) {
  console.warn("getFromLocalStorage is deprecated. Use specific Supabase operations instead.")

  // Provide backward compatibility for existing code
  switch (key) {
    case "products":
      return await getProducts()
    case "wholesalers":
      return await getWholesalers()
    case "sales":
      return await getSales()
    case "stockAdjustments":
      return await getStockAdjustments()
    case "currentUser":
      return await getCurrentUserSupabase()
    default:
      if (typeof window === "undefined") return null
      return JSON.parse(localStorage.getItem(key) || "null")
  }
}

export function saveToLocalStorage(key: string, data: any) {
  console.warn("saveToLocalStorage is deprecated. Use specific Supabase operations instead.")
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

export async function getCurrentUser() {
  return await getCurrentUserSupabase()
}

export async function isAdmin() {
  return await isAdminSupabase()
}

export function initializeLocalStorage() {
  console.warn("initializeLocalStorage is deprecated. Data is now managed by Supabase.")
  // Keep for backward compatibility but don't do anything
}
