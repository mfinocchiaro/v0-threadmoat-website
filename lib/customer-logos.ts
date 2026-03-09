/**
 * Map well-known customer names to their domains for logo fetching.
 * Uses Clearbit Logo API: https://logo.clearbit.com/{domain}
 */

const CUSTOMER_DOMAINS: Record<string, string> = {
  // Automotive
  "BMW": "bmw.com",
  "Volkswagen": "volkswagen.com",
  "Audi": "audi.com",
  "Ford": "ford.com",
  "Toyota": "toyota.com",
  "Tesla": "tesla.com",
  "Porsche": "porsche.com",
  "Mercedes": "mercedes-benz.com",
  "GM": "gm.com",
  "Stellantis": "stellantis.com",
  "Volvo": "volvo.com",
  "Hyundai": "hyundai.com",
  "Rivian": "rivian.com",
  "Lucid": "lucidmotors.com",

  // Aerospace & Defense
  "Airbus": "airbus.com",
  "Boeing": "boeing.com",
  "NASA": "nasa.gov",
  "Safran": "safrangroup.com",
  "Rolls-Royce": "rolls-royce.com",
  "Lockheed Martin": "lockheedmartin.com",
  "Northrop Grumman": "northropgrumman.com",
  "Raytheon": "rtx.com",
  "BAE Systems": "baesystems.com",
  "SpaceX": "spacex.com",
  "US Air Force": "af.mil",

  // Industrial / Manufacturing
  "Siemens": "siemens.com",
  "Bosch": "bosch.com",
  "ABB": "abb.com",
  "Schneider Electric": "se.com",
  "Caterpillar": "caterpillar.com",
  "GE": "ge.com",
  "Honeywell": "honeywell.com",
  "3M": "3m.com",
  "BASF": "basf.com",
  "DMG MORI": "dmgmori.com",
  "Schaeffler": "schaeffler.com",
  "Trumpf": "trumpf.com",
  "EOS": "eos.info",
  "Hexagon": "hexagon.com",
  "Cummins": "cummins.com",
  "Parker Hannifin": "parker.com",
  "Emerson": "emerson.com",
  "Rockwell": "rockwellautomation.com",
  "Fanuc": "fanuc.com",
  "KUKA": "kuka.com",

  // Tech
  "Google": "google.com",
  "Microsoft": "microsoft.com",
  "Amazon": "amazon.com",
  "Meta": "meta.com",
  "Apple": "apple.com",
  "HP": "hp.com",
  "Dell": "dell.com",
  "Intel": "intel.com",
  "AMD": "amd.com",
  "NVIDIA": "nvidia.com",
  "Qualcomm": "qualcomm.com",
  "Oracle": "oracle.com",
  "SAP": "sap.com",
  "Salesforce": "salesforce.com",
  "Autodesk": "autodesk.com",
  "PTC": "ptc.com",
  "Dassault": "3ds.com",
  "Dassault Systemes": "3ds.com",
  "Ansys": "ansys.com",

  // Consumer / Other
  "Adidas": "adidas.com",
  "Nike": "nike.com",
  "Samsung": "samsung.com",
  "Philips": "philips.com",
  "L'Oréal": "loreal.com",
  "P&G": "pg.com",
  "Merck": "merck.com",
  "Johnson & Johnson": "jnj.com",
  "Medtronic": "medtronic.com",
  "Thales": "thalesgroup.com",
  "Roche": "roche.com",
}

/**
 * Get Clearbit logo URL for a customer name.
 * Tries exact match first, then case-insensitive, then prefix/contains matching
 * to handle variants like "BMW Group" → "BMW", "Siemens AG" → "Siemens".
 */
export function getCustomerLogoUrl(name: string, size = 80): string | null {
  // 1. Exact match
  if (CUSTOMER_DOMAINS[name]) return `https://logo.clearbit.com/${CUSTOMER_DOMAINS[name]}?size=${size}`

  const nameLower = name.toLowerCase().trim()

  // 2. Case-insensitive exact match
  for (const [key, domain] of Object.entries(CUSTOMER_DOMAINS)) {
    if (key.toLowerCase() === nameLower) return `https://logo.clearbit.com/${domain}?size=${size}`
  }

  // 3. Prefix match — known brand is a prefix of the customer name (e.g., "Siemens AG" starts with "Siemens")
  for (const [key, domain] of Object.entries(CUSTOMER_DOMAINS)) {
    const keyLower = key.toLowerCase()
    if (nameLower.startsWith(keyLower) && (nameLower.length === keyLower.length || /[\s\-,.]/.test(nameLower[keyLower.length]))) {
      return `https://logo.clearbit.com/${domain}?size=${size}`
    }
  }

  return null
}

/** Check if a customer has a known domain for logo fetching (uses same fuzzy logic) */
export function hasCustomerLogo(name: string): boolean {
  return getCustomerLogoUrl(name) !== null
}

// ── Filtering ────────────────────────────────────────────────────────────────

/**
 * Patterns that indicate a non-company / vague entry in the Known Customers field.
 * Shared across CustomerNetwork chart and hover cards.
 */
const SKIP_PATTERNS = [
  /^n[\s./]*a\.?$/i,          // "N A", "N/A", "NA", "N.A." — standalone
  /undisclosed/i, /\bnone\b/i, /unknown/i, /not disclosed/i, /stealth/i,
  /targeted at/i, /various/i, /multiple/i, /general/i, /several/i, /esp\./i,
  /incl\./i, /e\.g\./i, /such as/i, /and others/i, /more$/i, /^\d/,
  /manufacturers/i, /companies$/i, /industries/i, /engineers/i, /teams$/i,
  /firms$/i, /clients$/i, /enterprises/i, /bureaus/i, /factories/i, /shops$/i,
  /customers$/i, /hospitals$/i, /universities$/i, /startups$/i, /agencies/i,
  /studios$/i, /globally/i, /users$/i, /developers$/i, /defense$/i,
  /aerospace$/i, /automotive$/i, /medical device/i, /construction$/i,
  /pharma$/i, /logistics$/i, /\bOEM\b/i, /mid-sized/i, /fortune/i,
  /pipeline$/i, /innovation labs/i, /design firms/i, /\bR&D\b/i,
  /\bAEC\b/i, /manufacturing$/i, /^major /i, /^top /i, /^leading /i,
]

function isRealCompany(name: string): boolean {
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 60) return false
  return !SKIP_PATTERNS.some(p => p.test(trimmed))
}

/**
 * Parse the raw comma-separated Known Customers string from the CSV,
 * filter out vague/generic entries, and return deduplicated real names.
 */
export function parseKnownCustomers(raw: string | undefined | null): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  return raw
    .split(",")
    .map(s => s.trim().replace(/^["']|["']$/g, ""))
    .filter(name => {
      if (!isRealCompany(name)) return false
      const key = name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
