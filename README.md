# BillThis

A private receipt maker for JoAnne's businesses. Fill in the form on the left, watch the receipt update on the right, then download it as a PDF, save it as an image, or print it.

## What it can do

- Keep several businesses (ProRN Inc. and any others), each with its own logo, address, tax number and receipt numbering
- Receipt numbers count up on their own when you save (for example PRN-0001, PRN-0002)
- Items with quantity and price, and a tick box to say whether tax applies to each one
- Ontario HST 13% set up by default, with room for more than one tax line, or none
- Discounts (dollar or percent), shipping, tips, and "prices already include tax"
- Payment method, reference number, amount paid and balance due, plus an optional PAID stamp
- Four looks: Modern, Classic, Minimal and Till roll (narrow store-style slip), with three fonts and your choice of accent colour
- CAD, USD, KYD, EUR and GBP
- History of every saved receipt, with search, reopen, and "copy as new"
- Back up and restore everything as one file
- Works on a phone (Edit and Preview tabs)

## Where your data lives

Everything stays in the browser you use it in. Nothing is sent anywhere. Use **Back up** every so often, and **Restore** to move your data to another computer or browser.

## Putting it online

It's a plain website with no build step. On vercel.com choose **Add New → Project**, pick the `billthis` repo, and press **Deploy**. Vercel needs no settings for it.

To try it on your own computer, just double-click `index.html`.

See `ARCHITECTURE.md` for how it works inside.
