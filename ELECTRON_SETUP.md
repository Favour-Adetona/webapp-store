# Electron Desktop App Setup

This guide explains how to run and build the Retail Operations app as a desktop application using Electron.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

This will install all dependencies including Electron and electron-builder.

## Development

To run the app in development mode with Electron:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js development server
2. Wait for it to be ready
3. Launch the Electron app

## Building for Production

### Build for Current Platform

```bash
npm run electron:build
```

### Build for Specific Platforms

**Windows:**
```bash
npm run electron:build:win
```

**macOS:**
```bash
npm run electron:build:mac
```

**Linux:**
```bash
npm run electron:build:linux
```

The built applications will be in the `dist` folder.

## Project Structure

```
webapp-store/
├── electron/
│   └── main.js          # Electron main process
├── app/                  # Next.js app directory
├── components/           # React components
├── out/                  # Next.js export output (generated)
└── dist/                 # Electron build output (generated)
```

## Notes

- The app runs Next.js in standalone export mode when building for Electron
- In development, Electron connects to the Next.js dev server
- In production, Electron serves the static Next.js export
- The app window is configured with sensible defaults (1200x800, minimum 800x600)

## Troubleshooting

If you encounter issues:

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Rebuild Electron dependencies:**
   ```bash
   npm run postinstall
   ```

3. **Check Next.js build:**
   ```bash
   ELECTRON=1 npm run build
   ```

4. **Run Electron directly:**
   ```bash
   ELECTRON=1 npm run build
   npm run electron
   ```


