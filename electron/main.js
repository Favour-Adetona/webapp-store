const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

// Initialize SQLite database in main process
let db = null
function initializeDatabase() {
  if (db) return db
  
  try {
    const Database = require('better-sqlite3')
    const fs = require('fs')
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'retail-operations.db')
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    db = new Database(dbPath)
    db.pragma('foreign_keys = ON')
    
    // Create tables (schema will be created by the renderer process)
    console.log('SQLite database initialized at:', dbPath)
    return db
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error)
    return null
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/placeholder-logo.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Load the app
  if (isDev) {
    // In development, load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000')
  } else {
    // In production, load from the built Next.js app
    const indexPath = path.join(__dirname, '../out/index.html')
    mainWindow.loadFile(indexPath)
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers for database path
ipcMain.handle('get-database-path', () => {
  return path.join(app.getPath('userData'), 'retail-operations.db')
})

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

app.whenReady().then(() => {
  // Enable touch events (can help with click events on some systems)
  app.commandLine.appendSwitch('touch-events', 'enabled')
  
  // Initialize database
  initializeDatabase()
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Cleanup database on app quit
app.on('before-quit', () => {
  if (db) {
    db.close()
    db = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault()
    }
  })
})

