# How BillThis works

This is the plain-English map of the app. Update it whenever something changes.

## The four files

| File | What it does |
|---|---|
| `index.html` | The page itself: the top bar, the form on the left, the receipt preview on the right, the History drawer, and the template gallery. |
| `templates.js` | The list of templates in the gallery (19 so far), grouped by type. Add a new one by copying an entry. |
| `styles.css` | How everything looks. The top half styles the app. The bottom half ("Receipt paper") styles the receipt, including the four looks. |
| `app.js` | The brains: remembers your data, does the math, draws the receipt, and handles the buttons. |

There is no server, no database, no login and no build step. One outside library is loaded from cdnjs: **html2pdf.js**, which turns the receipt into a PDF or image.

## How the data is kept

Everything is stored in the browser's `localStorage` under one key, `billthis:v1`, as a single bundle:

- **profiles**: your businesses. Each has its details (name, address, phone, email, website, tax number, logo, receipt prefix), the next receipt number, and its **defaults** (currency, taxes, look, payment method, footer). Defaults update each time you save a receipt, so the next one starts the same way.
- **activeProfileId**: which business is selected.
- **history**: every saved receipt, as a full copy, plus its business name, logo and total.
- **draft**: whatever is on screen right now, so a refresh doesn't lose your work. It saves itself about half a second after you stop typing.

Logos are shrunk to at most 480 pixels before saving so they don't fill up the browser's storage.

**Back up** downloads this whole bundle as a `.json` file. **Restore** replaces the bundle with one from a file.

## How a change flows through

1. You type in any box. Every box has a tag saying what it controls (`data-field` for the receipt, `data-biz` for the business, `data-cust` for the customer, `data-item` and `data-tax` for rows).
2. One listener in `app.js` sees the change and updates the matching piece of data.
3. `renderReceipt()` redraws the receipt from that data. All text is made safe before it is shown.
4. A short timer then saves to the browser.

## The math (`totals()`)

- Each line is quantity × price. The subtotal adds them all.
- A discount comes off the subtotal (dollars, or a percent of it), and is shared across taxed and untaxed items in proportion.
- Tax is worked out only on items with the Tax box ticked, after the discount.
- If "Prices already include tax" is on, the tax is pulled out of the prices instead of added on top.
- Total = subtotal − discount + tax + shipping + tip. Shipping and tips aren't taxed.
- If "Amount paid" is blank the receipt counts as paid in full. If you enter an amount, it shows what was paid and any balance due. The PAID stamp only appears when nothing is owing.

## Receipt numbers

Each business has a prefix (like `PRN-`) and a next number. A new receipt shows prefix + next number padded to four digits. When you **Save** a new receipt with that number, the next number goes up by one. Saving an opened receipt again just updates it. "Copy as new" gives the copy the next number and today's date.

## Templates and layouts

**Templates** are what you pick in the gallery: Business, Services, Retail, Food, Stay & Travel, and Rent & Other. Each one in `templates.js` sets a layout, font, colour, title, footer and starter lines. The gallery opens on your first visit, every time you press **New**, and from **Templates** or **Browse templates**. Picking one for a new receipt starts fresh. Picking one while changing template only restyles it and keeps your details and items (unless the items are empty, then it adds the starter lines). The little gallery previews are real receipts drawn by the same `buildReceipt()` code as the main preview, using sample prices and your business name.

**Layouts** are the five page designs underneath: Modern, Classic, Minimal, Bold header and Till roll. You can switch layout on its own in Look & style. The receipt is one piece of HTML. The layout is a class on it (`t-modern`, `t-classic`, `t-minimal`, `t-bold`, `t-thermal`) and the font is another (`f-sans`, `f-serif`, `f-mono`). The accent colour is a CSS variable. Till roll is a narrow 320-pixel slip in a typewriter font that hides the quantity and price columns.

## Exporting

- **Download PDF** sizes the PDF page to the receipt itself, so it always fits on one page. Full-size looks come out at letter shape; Till roll comes out as a long narrow slip.
- **Image** saves a sharp PNG of the receipt, handy for texting.
- **Print** uses the browser's print window. Print styles hide everything except the receipt.

## Phones

Under 900 pixels wide the page switches to Edit and Preview tabs, and the receipt shrinks to fit the screen. It's shrunk back to full size for a moment while exporting so files always come out sharp.

## Testing

The site was checked with an automated browser that fills in a full receipt, checks the totals (tax, discounts, tax-included, balance due), tries all four looks, downloads PDF and image files, saves, opens history, copies a receipt, adds a second business, reloads to confirm everything was kept, and checks the phone layout.
