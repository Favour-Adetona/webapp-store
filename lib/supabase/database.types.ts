export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          name: string
          role: "admin" | "staff"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          name: string
          role: "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          name?: string
          role?: "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          packaging: string
          price: number
          stock: number
          low_stock_threshold: number
          expiry_date: string | null
          image: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          packaging: string
          price: number
          stock?: number
          low_stock_threshold?: number
          expiry_date?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          packaging?: string
          price?: number
          stock?: number
          low_stock_threshold?: number
          expiry_date?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      wholesalers: {
        Row: {
          id: string
          name: string
          contact: string
          phone: string
          products: string[]
          expected_delivery: string | null
          capital_spent: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          contact: string
          phone: string
          products?: string[]
          expected_delivery?: string | null
          capital_spent?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          contact?: string
          phone?: string
          products?: string[]
          expected_delivery?: string | null
          capital_spent?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      sales: {
        Row: {
          id: string
          items: Json
          subtotal: number
          discount: number
          discount_amount: number
          total: number
          created_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          id?: string
          items: Json
          subtotal: number
          discount?: number
          discount_amount?: number
          total: number
          created_at?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          id?: string
          items?: Json
          subtotal?: number
          discount?: number
          discount_amount?: number
          total?: number
          created_at?: string
          user_id?: string | null
          user_name?: string
        }
      }
      stock_adjustments: {
        Row: {
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          reason: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          reason: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string
          created_at?: string
          created_by?: string | null
        }
      }
      audit_trail: {
        Row: {
          id: string
          timestamp: string
          user_id: string | null
          user_name: string
          user_role: string
          action: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_name: string
          user_role: string
          action: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
          details: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_name?: string
          user_role?: string
          action?: "login" | "sale" | "inventory_add" | "inventory_edit" | "stock_adjustment"
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
