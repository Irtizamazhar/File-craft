# FileCraft design system
The two approved references define the coral/navy/light-blush/lavender identity. Existing FileCraft wordmark and document symbol are retained.

Tokens in app/design-system.css: coral #F04457, navy #11182E, blush #FCECEF, lavender #EEE7FF, white, and darker accessible text/action variants. Primary buttons use a darker coral for readable white labels. Rounded cards, restrained shadows and a common container establish the layout. Reuse the existing CSS system; no new CSS framework or icon system.

Typography uses the system font stack without blocking third-party font downloads. Headings use tight spacing and restrained weight; UI text has explicit accessible neutrals. Containers are capped at 1360px with smaller gutters on mobile. Breakpoints: 1150, 900, 540px, plus wide-screen adjustment. Base CSS still supplies compatible legacy layouts.

Reusable components: Header disclosure navigation, HeroUpload, HeroArtwork (original code illustration), Faq, Pricing, ToolCard, ToolCatalog, ToolProcessor, SavedTools, PageSkeleton, ContentAds. Shared styling covers public pages, categories, guides, legal/contact, login/signup, dashboard/settings, admin/unauthorized, errors and loading states.

Touch targets, focus rings, semantic details/summary, aria-expanded controls, Escape close with focus return, pressed category/billing buttons, alerts and reduced-motion preferences are included. Automated WCAG-tagged axe scans pass on eight screens in desktop/mobile Chromium; this is not full WCAG certification.

Homepage files are content-validated and held in memory for a chosen tool for up to five minutes. Category selection is explicit. Tool controls use actual registry capabilities; result sizes and compression percentages come from real Blob sizes. Output names are sanitized and preserve the correct extension. Saved shortcuts use browser localStorage and are explicitly labeled as browser-local.

Pricing visually follows the reference while showing real Free limits. Planned paid features are labeled planned. No prices, discounts, popularity metrics, checkout or payment success are invented.
