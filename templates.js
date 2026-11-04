/* BillThis template gallery.
   Each template is a starting look: the layout, font, colour, title, footer,
   and the starter lines it puts on a new receipt. "sample" prices are only
   used for the little previews in the gallery. Add more by copying one. */

window.BILLTHIS_TEMPLATES = [
  // ---- Business ----
  { id: "modern", name: "Modern", cat: "Business", blurb: "Colour band, bold total",
    layout: "modern", font: "sans", accent: "#1f6f5c", title: "Receipt", footer: "Thank you for your business!",
    items: [["Professional services", 1, 250]] },
  { id: "classic", name: "Classic", cat: "Business", blurb: "Framed, timeless serif",
    layout: "classic", font: "serif", accent: "#18181b", title: "Receipt", footer: "Thank you for your business.",
    items: [["Professional services", 1, 250]] },
  { id: "minimal", name: "Minimal", cat: "Business", blurb: "Quiet, lots of white space",
    layout: "minimal", font: "sans", accent: "#18181b", title: "Receipt", footer: "Thank you",
    items: [["Professional services", 1, 250]] },
  { id: "bold", name: "Bold Header", cat: "Business", blurb: "Full colour header block",
    layout: "bold", font: "sans", accent: "#2f5bd3", title: "Payment Receipt", footer: "Thank you for your business!",
    items: [["Project work", 1, 500]] },
  { id: "invoice", name: "Invoice", cat: "Business", blurb: "For bills still owing",
    layout: "modern", font: "sans", accent: "#18181b", title: "Invoice", footer: "Payment due within 30 days. Thank you!",
    items: [["Consulting", 10, 95]], unpaid: true },

  // ---- Services ----
  { id: "consulting", name: "Consulting", cat: "Services", blurb: "Hours × rate",
    layout: "bold", font: "sans", accent: "#0e7490", title: "Service Receipt", footer: "Thank you for working with us.",
    items: [["Consulting hours", 4, 120], ["Written report", 1, 200]] },
  { id: "nursing", name: "Nursing & Care", cat: "Services", blurb: "Shifts and visits",
    layout: "minimal", font: "sans", accent: "#0e7490", title: "Payment Receipt", footer: "Thank you. Wishing you a smooth recovery.",
    items: [["Private nursing shift (12 h)", 1, 600], ["Home visit", 1, 120]] },
  { id: "freelance", name: "Freelance", cat: "Services", blurb: "Writing, design, creative",
    layout: "modern", font: "serif", accent: "#7a3ff0", title: "Receipt", footer: "Thanks for the work together!",
    items: [["Article, 1,200 words", 2, 180]] },

  // ---- Retail ----
  { id: "store-till", name: "Store Till", cat: "Retail", blurb: "Narrow printed slip",
    layout: "thermal", font: "mono", accent: "#18181b", title: "Sales Receipt", footer: "Thank you for shopping with us!\nKeep this receipt for returns.",
    items: [["Item", 2, 12.99], ["Item", 1, 24.5], ["Item", 3, 4.25]] },
  { id: "boutique", name: "Boutique", cat: "Retail", blurb: "Elegant shop receipt",
    layout: "minimal", font: "serif", accent: "#be185d", title: "Sales Receipt", footer: "Thank you for shopping with us ♡",
    items: [["Item", 1, 68], ["Item", 1, 32]] },
  { id: "market", name: "Market Stall", cat: "Retail", blurb: "Pop-ups and markets",
    layout: "thermal", font: "sans", accent: "#c2410c", title: "Receipt", footer: "Thanks for supporting local!",
    items: [["Item", 2, 8], ["Item", 1, 15]] },

  // ---- Food ----
  { id: "cafe", name: "Café Till", cat: "Food", blurb: "Counter receipt with tip",
    layout: "thermal", font: "mono", accent: "#18181b", title: "Receipt", footer: "Thanks for stopping by!",
    items: [["Coffee", 2, 4.75], ["Pastry", 1, 3.95]], tip: 2 },
  { id: "dine-in", name: "Dine-in", cat: "Food", blurb: "Full-page restaurant bill",
    layout: "classic", font: "serif", accent: "#9f1239", title: "Guest Receipt", footer: "Thank you for dining with us.",
    items: [["Main course", 2, 28], ["Dessert", 2, 9], ["Beverages", 2, 7]], tip: 15 },
  { id: "catering", name: "Catering", cat: "Food", blurb: "Events and orders",
    layout: "bold", font: "serif", accent: "#9f1239", title: "Catering Receipt", footer: "Thank you for letting us cater your event!",
    items: [["Catering per guest", 25, 32], ["Delivery & setup", 1, 75]] },

  // ---- Stay & travel ----
  { id: "stay", name: "Stay Folio", cat: "Stay & Travel", blurb: "Nightly rate stays",
    layout: "classic", font: "serif", accent: "#1f6f5c", title: "Guest Folio", footer: "Thank you for staying with us.",
    items: [["Room, nightly rate", 3, 145], ["Cleaning fee", 1, 60]] },
  { id: "trip", name: "Trip", cat: "Stay & Travel", blurb: "Rides and deliveries",
    layout: "thermal", font: "sans", accent: "#18181b", title: "Trip Receipt", footer: "Thanks for riding with us!",
    items: [["Base fare", 1, 4.5], ["Distance (km)", 12, 1.1], ["Time (min)", 18, 0.3]], tip: 3 },

  // ---- Rent & other ----
  { id: "rent", name: "Rent", cat: "Rent & Other", blurb: "Monthly rent payment",
    layout: "minimal", font: "sans", accent: "#18181b", title: "Rent Receipt", footer: "Received with thanks.",
    items: [["Rent for the month", 1, 1850]], noTax: true },
  { id: "donation", name: "Donation", cat: "Rent & Other", blurb: "Gifts and contributions",
    layout: "classic", font: "serif", accent: "#7a3ff0", title: "Donation Receipt", footer: "Thank you for your generosity.",
    items: [["Donation", 1, 100]], noTax: true },
  { id: "cash", name: "Cash", cat: "Rent & Other", blurb: "Simple cash slip",
    layout: "thermal", font: "mono", accent: "#18181b", title: "Cash Receipt", footer: "Received in cash.",
    items: [["Payment", 1, 40]], noTax: true, method: "Cash" },
];
