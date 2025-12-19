// Dynamic imports to prevent webpack from bundling Node.js-only modules in web builds
let Database: any = null
let path: any = null
let fs: any = null

// Lazy load Node.js modules only when needed (Electron environment)
function loadNodeModules() {
  if (Database && path && fs) return
  
  // Don't try to load in web builds (Next.js webpack will try to bundle it)
  if (typeof window !== 'undefined' && !(window as any).electron && !(window as any).process?.type) {
    // Not in Electron, skip loading
    return
  }
  
  try {
    // Dynamic require to prevent webpack from statically analyzing
    const requireFunc = typeof require !== 'undefined' ? require : (() => {
      throw new Error('require is not available')
    })
    Database = requireFunc('better-sqlite3')
    path = requireFunc('path')
    fs = requireFunc('fs')
  } catch (error) {
    // Not in Node.js environment or better-sqlite3 not available
    console.warn('Could not load Node.js modules for SQLite:', error)
  }
}

let db: any = null

/**
 * Get the path to the SQLite database file
 * In Electron, this should be called from the main process
 */
export function getDatabasePath(userDataPath?: string): string {
  // Load path module if needed
  loadNodeModules()
  
  if (!path) {
    // Fallback if path module not available
    return './retail-operations.db'
  }
  
  if (typeof window !== 'undefined') {
    // Running in renderer process - try to get path via IPC
    try {
      // With nodeIntegration enabled, we can use require directly
      const electron = require('electron')
      if (electron.ipcRenderer) {
        return electron.ipcRenderer.sendSync('get-database-path')
      }
    } catch (error) {
      console.warn('Could not get database path via IPC:', error)
    }
    
    // Fallback: use a local path
    if (typeof process !== 'undefined' && process.cwd) {
      return path.join(process.cwd(), 'retail-operations.db')
    }
    return './retail-operations.db'
  }
  
  // Running in main process or Node.js
  if (userDataPath) {
    return path.join(userDataPath, 'retail-operations.db')
  }
  
  // Fallback for Node.js environment
  if (typeof process !== 'undefined' && process.cwd) {
    return path.join(process.cwd(), 'retail-operations.db')
  }
  return './retail-operations.db'
}

/**
 * Initialize SQLite database with schema
 * This should be called from the Electron main process
 */
export function initializeDatabase(userDataPath?: string): any {
  if (db) return db

  // Load Node.js modules
  loadNodeModules()
  
  if (!Database || !path || !fs) {
    throw new Error('SQLite modules not available. This should only run in Electron.')
  }

  const dbPath = getDatabasePath(userDataPath)
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Create tables
  createTables(db)
  
  return db
}

/**
 * Get the database instance (initialize if needed)
 * Works in both main process and renderer (with nodeIntegration enabled)
 */
export function getDatabase(): any {
  if (!db) {
    // Load Node.js modules first
    loadNodeModules()
    
    if (!Database || !path || !fs) {
      throw new Error('SQLite modules not available. This should only run in Electron.')
    }
    
    // Try to get userData path if in Electron
    let userDataPath: string | undefined
    try {
      if (typeof window !== 'undefined') {
        // Renderer process - try IPC to get database path
        try {
          const electron = require('electron')
          if (electron.ipcRenderer) {
            const dbPath = electron.ipcRenderer.sendSync('get-database-path')
            userDataPath = path.dirname(dbPath)
          }
        } catch (error) {
          console.warn('Could not get database path via IPC:', error)
        }
      } else {
        // Main process or Node.js
        try {
          const { app } = require('electron')
          userDataPath = app.getPath('userData')
        } catch {
          // Not in Electron
        }
      }
    } catch (error) {
      console.warn('Error getting userData path:', error)
    }
    return initializeDatabase(userDataPath)
  }
  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Create all database tables matching Supabase schema
 */
function createTables(database: any): void {
  // Users table (for reference, auth still handled by Supabase)
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Products table
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      packaging TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
      expiry_date TEXT,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      created_by TEXT REFERENCES users(id)
    )
  `)

  // Create indexes for products
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
  `)

  // Wholesalers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS wholesalers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      phone TEXT NOT NULL,
      products TEXT NOT NULL DEFAULT '[]',
      expected_delivery TEXT,
      capital_spent REAL NOT NULL DEFAULT 0 CHECK (capital_spent >= 0),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      created_by TEXT REFERENCES users(id)
    )
  `)

  // Sales table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL CHECK (subtotal >= 0),
      discount REAL NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
      discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
      total REAL NOT NULL CHECK (total >= 0),
      created_at TEXT DEFAULT (datetime('now')),
      user_id TEXT REFERENCES users(id),
      user_name TEXT NOT NULL
    )
  `)

  // Create indexes for sales
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
  `)

  // Stock adjustments table
  database.exec(`
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT REFERENCES users(id)
    )
  `)

  // Create indexes for stock adjustments
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);
  `)

  // Audit trail table
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT (datetime('now')),
      user_id TEXT REFERENCES users(id),
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('login', 'sale', 'inventory_add', 'inventory_edit', 'stock_adjustment')),
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Create indexes for audit trail
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
  `)
}

/**
 * Generate a UUID v4 (for compatibility with Supabase UUIDs)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

