import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the best text color ("#fff" or "#000") for readable contrast
 * against the given background color string.
 * Handles hex (#abc, #aabbcc), rgb(), and common named colors.
 */
export function contrastTextColor(bg: string): string {
  const rgb = parseColorToRgb(bg)
  if (!rgb) return '#fff' // default to white for unparseable colors
  // Relative luminance (sRGB)
  const [r, g, b] = rgb.map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return L > 0.4 ? '#000' : '#fff'
}

function parseColorToRgb(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase()
  // hex
  const hex3 = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  if (hex3) return [parseInt(hex3[1]+hex3[1],16), parseInt(hex3[2]+hex3[2],16), parseInt(hex3[3]+hex3[3],16)]
  const hex6 = c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/)
  if (hex6) return [parseInt(hex6[1],16), parseInt(hex6[2],16), parseInt(hex6[3],16)]
  // rgb(r,g,b) or rgba(r,g,b,a)
  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]]
  return null
}

export function normalizeLogoName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
