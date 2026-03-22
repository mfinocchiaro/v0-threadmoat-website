import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: {
      Common: (await import(`../messages/${locale}/common.json`)).default,
      Home: (await import(`../messages/${locale}/home.json`)).default,
      Pricing: (await import(`../messages/${locale}/pricing.json`)).default,
      About: (await import(`../messages/${locale}/about.json`)).default,
      Report: (await import(`../messages/${locale}/report.json`)).default,
    },
  }
})
