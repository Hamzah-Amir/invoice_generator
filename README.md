# Invoice Generator (Next.js + Prisma + pdf-lib)

Production-ready Next.js App Router project that loads PDF templates, overlays invoice data with **pdf-lib**, stores each invoice in **MySQL** via **Prisma**, and returns a freshly generated PDF for download.

The project ships with two working templates under `/templates`. The UI reads whatever templates exist in that folder, so you can scale up to ~10 sellers (or more) just by dropping additional PDF/JSON pairs in place.

---

## Tech Stack

- Next.js 14 (App Router, JavaScript only)
- React 18
- Prisma ORM (JavaScript client)
- MySQL (local or managed)
- pdf-lib for PDF manipulation
- pdfjs-dist for the coordinate calibration preview

---

## Directory Overview

```
app/
  page.jsx                     # Seller landing page
  invoice/[seller]/page.jsx    # Invoice form per seller
  calibrate/page.jsx           # Coordinate calibration UI
  api/
    generate-invoice/route.js  # Saves invoice + streams PDF
    templates/route.js         # Lists templates (JSON)
    templates/[template]/route.js # Serves template PDF/JSON
components/
  InvoiceForm.jsx
  CalibrateTool.jsx
lib/
  prisma.js
  pdf.js
  templates.js
prisma/
  schema.prisma
public/fonts/
  README.md                    # Drop custom .ttf files here
templates/
  template1.pdf / template1.json
  template2.pdf / template2.json
scripts/
  makeTemplates.js             # Utility used to build placeholders
utils/
  (place optional scripts here)
```

---

## Getting Started

### 1. Requirements

- Node.js 18+
- npm 9+
- MySQL 8 (local Docker or managed instance)

### 2. Clone & Install

```bash
npm install
```

### 3. Configure MySQL

Create a database and user (example shown for local MySQL shell):

```sql
CREATE DATABASE invoice_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'invoice_user'@'localhost' IDENTIFIED BY 'super-secret';
GRANT ALL PRIVILEGES ON invoice_generator.* TO 'invoice_user'@'localhost';
FLUSH PRIVILEGES;
```

Create a `.env` file in the project root:

```env
DATABASE_URL="mysql://invoice_user:super-secret@localhost:3306/invoice_generator"
```

### 4. Prisma workflow

```bash
npx prisma generate          # builds the JS client
npx prisma migrate dev       # creates tables described in prisma/schema.prisma
```

Each new schema change should follow the same pattern (`prisma generate` + `prisma migrate dev`).

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000` to pick a seller template and generate invoices.

---

## Invoice Flow (Database-first)

1. User selects a seller template on `/`.
2. Form at `/invoice/[seller]` validates required fields client-side.
3. POST `/api/generate-invoice`:
   - Validates again on the server.
   - Computes `lineTotal = quantity * priceGBP` and `total = lineTotal + postageGBP`.
   - Persists the record with Prisma (`Invoice` model).
   - Calls `lib/pdf.js` to load `/templates/<seller>.pdf`, draws fields via pdf-lib using the coordinates from `/templates/<seller>.json`, and embeds an optional custom font from `/public/fonts`.
4. API response streams the binary PDF with `Content-Type: application/pdf` and a download-friendly `Content-Disposition`.

Every invoice stored in MySQL contains the exact data used to build the PDF, preserving an auditable history.

---

## Template Format

Each template needs two files with the same base name:

```
/templates/template-name.pdf   # Background (flattened artwork is fine)
/templates/template-name.json  # Coordinate map
```

Example JSON (matching the included files):

```json
{
  "seller": "Acme Supplies Ltd",
  "description": "Primary seller layout with right-aligned totals.",
  "fields": {
    "productName": { "x": 120, "y": 540, "size": 12 },
    "quantity": { "x": 120, "y": 520, "size": 12 },
    "priceGBP": { "x": 400, "y": 520, "size": 12 },
    "total": { "x": 400, "y": 500, "size": 12 },
    "date": { "x": 400, "y": 700, "size": 12 },
    "invoiceNumber": { "x": 400, "y": 730, "size": 12 },
    "notes": { "x": 120, "y": 460, "size": 10 }
  }
}
```

Add up to ~10 seller templates by repeating this pair; the landing page automatically lists every JSON file discovered in `/templates`. Any field can target multiple coordinates by passing an array of `{ "x", "y", "size" }` objects, which is handy for mirroring totals in multiple columns.

---

## Calibration Tool

- Navigate to `/calibrate`.
- Choose a template (the page loads the matching PDF from `/templates` through `/api/templates/[template]`).
- Click anywhere on the rendered PDF to log `(x, y)` coordinates in the native PDF coordinate space (origin at the bottom-left).
- Copy the generated JSON snippet into the template’s `.json` file.

`pdfjs-dist` renders the PDF inside a `<canvas>`, so the clicks map 1:1 with pdf-lib coordinates.

---

## PDF Generation Details

- `lib/pdf.js` uses pdf-lib’s `PDFDocument.load` to treat the template as a static background.
- Fields draw with Helvetica by default. Drop any `.ttf` file into `public/fonts/` to override the font globally (no code changes needed).
- Every API response sets:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename=invoice-<number>.pdf`
- `notes` supports multi-line content; each line is rendered with a simple line-height offset.

---

## Useful Commands

| Task | Command |
| --- | --- |
| Install deps | `npm install` |
| Generate Prisma client | `npx prisma generate` |
| Run migrations | `npx prisma migrate dev` |
| Rebuild sample templates | `npm run templates` |
| Start dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build for production | `npm run build && npm run start` |

---

## Deployment Notes

- Set `DATABASE_URL` in your hosting provider (Vercel, Render, Fly, etc.).
- The project relies on the Node.js runtime because it needs filesystem access for `/templates`.
- Templates are loaded at runtime, so deploy them alongside the app (commit the files or fetch them from shared storage).

---

## Calibration / Maintenance Tips

1. Upload the designer’s flattened PDF to `/templates`.
2. Visit `/calibrate`, pick the new template, and click the regions where each field should appear.
3. Copy the JSON snippet, name the fields appropriately, and save it as `/templates/<seller>.json`.
4. Restart the dev server (or redeploy). The seller automatically shows up on the landing page.

Happy invoicing!
