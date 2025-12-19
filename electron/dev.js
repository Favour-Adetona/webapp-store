const { spawn } = require('child_process')
const { app } = require('electron')
const path = require('path')

let nextProcess

// Start Next.js dev server
function startNextDev() {
  return new Promise((resolve) => {
    console.log('Starting Next.js dev server...')
    
    nextProcess = spawn('npm', ['run', 'dev'], {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '3000',
      },
    })

    nextProcess.on('error', (err) => {
      console.error('Failed to start Next.js dev server:', err)
      app.quit()
    })

    // Wait a bit for server to start
    setTimeout(() => {
      resolve()
    }, 5000)
  })
}

// Cleanup on exit
process.on('exit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})

process.on('SIGINT', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  app.quit()
})

process.on('SIGTERM', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  app.quit()
})

module.exports = { startNextDev }


