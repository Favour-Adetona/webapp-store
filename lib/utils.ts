import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if the app is running in Electron environment
 */
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).electron || !!(window as any).process?.type || navigator.userAgent.includes('Electron')
}
