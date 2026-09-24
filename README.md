# Product Admin Dashboard

A fully-featured Next.js admin dashboard for managing products, built with React, TypeScript, Tailwind CSS, and Axios. Uses the [DummyJSON](https://dummyjson.com) API as the backend.

## ✨ Features

### 🔐 Authentication
- **Login page** with username/password validation and clear error messages
- **Protected routes** — only authenticated users can access product pages
- **Token persistence** via localStorage (60-minute session expiry)
- **Logout button** in the navbar that clears the session
- Auto-redirect unauthenticated users to `/login`
- Auto-redirect authenticated users from `/login` to `/products`

**Demo credentials:**
```
Username: emilys
Password: emilyspass
```

### 📋 Product List (`/products`)
- **Responsive views:** Data table on desktop (md+), card grid on mobile
- **Columns:** Product image + title + brand, category badge, price, star rating, stock status with color dots, and action buttons (View / Edit / Delete)
- **Pagination:** Page-by-page loading using API `limit` and `skip` parameters
  - Page number buttons with first + last always shown and ellipsis in the middle
  - Previous / Next buttons (disabled on boundaries)
  - Page size selector: 10 / 20 / 50
  - Summary text: `"Showing 21–40 of 194"`
- **Search** (`/products/search?q=`) with 400ms debounce
  - Resets to page 1 when search changes
  - Clear search button (×)
- **Filter** by category (`/products/categories`)
- **Sort** by Price, Rating, or Title — toggle ascending/descending
- **Tag-style active filters** with individual remove buttons
- **"Clear all filters"** shortcut
- **Empty state** when no products match, with primary action to clear filters
- **Error state** with a Retry button

### 🔍 Product Details (`/products/[id]`)
- Large image with thumbnail gallery (clickable switcher)
- Category / brand / stock badges
- Star rating with review count
- Price with strikethrough before-discount and discount badge
- Description, tags, info cards (Warranty / Shipping / Returns / Min. Order)
- **Reviews section** with avatars, dates, per-review stars, and comments
- Edit + Delete action buttons
- **404-style "Product not found" page** for invalid IDs (with back navigation)

### ➕ Add Product (`/products/new`) & Edit (`/products/[id]/edit`)
- Shared `ProductForm` component with full client-side validation:
  - Title (3–200 chars, required)
  - Description (≥10 chars, required)
  - Category (dropdown, required)
  - Price (≥0, required)
  - Discount % (0–100, required)
  - Rating (0–5, required)
  - Stock (integer ≥0, required)
  - Brand (optional, ≤100 chars)
  - Thumbnail URL (optional, valid URL check + live preview)
- Per-field errors on blur and on submit
- Submit button is disabled + shows spinner while submitting (prevents double-clicks via ref guard)
- Success banner + auto-redirect to the product detail page after save

### 🗑️ Delete
- Confirmation modal (`ConfirmDialog`) with descriptive product title
- Esc key + backdrop click to cancel
- Spinner on confirm while API call runs
- Success toast after delete, list auto-refreshes

### 🧠 Data & UX Details
- **Shared Axios setup** (`src/lib/axios.ts`):
  - Base URL, 30s timeout, JSON content type
  - Request interceptor injects `Authorization: Bearer <token>` header
  - Response interceptor centralises errors into typed `ApiError`
  - On 401: auto-clears token with "Session expired" message
- **API calls in dedicated service files** (`src/services/authApi.ts`, `src/services/productApi.ts`) — never inside UI components
- **URL state management:** page, limit, search, category, sort, and order all live in the query string. Refreshing / copying the URL reproduces the exact view:
  ```
  /products?search=phone&category=smartphones&sort=price&order=desc&page=2&limit=20
  ```
- **Robust URL parsing** (`src/lib/urlHelpers.ts`): values like `?page=abc` fall back to 1, `?page=9999` clamps to `totalPages`, invalid `limit` falls back to 10, invalid sort fields are ignored
- **Debounced search + race-condition safety** via `useLatestAsync`: each request is tagged with an incrementing ID — if a newer request was fired before the old one resolves, the stale result is silently dropped
- **Search + category together:** The DummyJSON API cannot combine `/products/search` with category filtering, so the app **runs the search first, then filters by category on the client side**. This keeps both controls usable and the UX predictable, at the cost of more data transferred (the API is called with a higher page size to compensate).
- **Optimistic create / update / delete:** The DummyJSON `/products/add`, `/products/:id` PUT, and DELETE endpoints don't actually persist changes — they just echo the request back. Changes are therefore **mirrored into `localStorage`** (`localChanges.ts`) and merged back into every list/detail response (API wins, then local edits/deletions/additions are layered on top). IDs for newly created products are negative integers to avoid colliding with the real API IDs.
- **Double-submit protection** everywhere: a `submittedRef.current` guard + disabled buttons prevent fast repeated clicks from firing multiple requests
- **Loading states:** dedicated `PageLoader`, inline `ButtonSpinner`, and skeleton-like disabled states

## 🗂️ Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout + AuthProvider
│   ├── page.tsx              # Redirects → /products
│   ├── globals.css           # Tailwind directives + base styles
│   ├── not-found.tsx         # Global 404 page
│   ├── login/page.tsx        # Login page
│   └── products/
│       ├── page.tsx          # Product list (search, filter, sort, paginate)
│       ├── new/page.tsx      # Add product form
│       └── [id]/
│           ├── page.tsx      # Product detail + not-found handling
│           └── edit/page.tsx # Edit product form
├── components/
│   ├── Navbar.tsx
│   ├── ProductTable.tsx      # Desktop table
│   ├── ProductCard.tsx       # Mobile cards
│   ├── ProductForm.tsx       # Shared add/edit form with validation
│   ├── Pagination.tsx
│   ├── ConfirmDialog.tsx
│   ├── Loader.tsx            # Loader / PageLoader / ButtonSpinner
│   ├── EmptyState.tsx
│   └── ErrorState.tsx
├── context/
│   └── AuthContext.tsx       # Auth state + route protection
├── hooks/
│   ├── useDebounce.ts
│   ├── useLatestAsync.ts     # Cancels stale async results
│   └── useLoadingState.ts
├── lib/
│   ├── axios.ts              # Shared Axios instance + interceptors
│   ├── urlHelpers.ts         # Safe URL parameter parsing
│   └── localChanges.ts       # localStorage-backed optimistic updates
├── services/
│   ├── authApi.ts
│   └── productApi.ts
└── types/
    └── index.ts              # Product, User, Review, Form types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or newer (Next.js 14 App Router requirement)
- npm / yarn / pnpm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Then open **http://localhost:3000** in your browser. You'll be redirected to `/login`.

### Available Scripts

| Command         | Description                           |
|-----------------|---------------------------------------|
| `npm run dev`   | Start the development server          |
| `npm run build` | Create an optimised production build |
| `npm start`     | Run the production build locally      |
| `npm run lint`  | Run ESLint against `src/`             |

## 🛠️ Tech Stack

- **Next.js 14** (App Router) with React 18 — SSR-ready route segments
- **TypeScript** — strict typing across the whole app
- **Tailwind CSS** — utility-first styling, custom `primary` palette
- **Axios** — shared instance with token injection + error interceptor
- **No React Query / SWR** — data fetching logic written from scratch per requirements
- **No ready-made table/pagination libraries** — Pagination, ProductTable, filters are all custom-built
- **Next.js `next/image`** — with remote patterns configured for `cdn.dummyjson.com`

## 📝 Design Choices

### Why DummyJSON's limitations are handled the way they are

1. **Search + category together**
   The endpoint `/products/search?q=` doesn't accept a `category` param, and `/products/category/:slug` doesn't accept a `q` param. We chose to **prioritise search** because it's the more commonly used filter, then apply category filtering on the client. This means:
   - You'll always get the correct search results
   - Category filtering will further narrow the results
   - We fetch a larger batch (up to 500 rows) from the API so client-side category paginated totals stay accurate

2. **Add / Edit / Delete are not real on the API**
   The DummyJSON docs explicitly state `/products/add` and the mutation endpoints return the payload but **don't actually save anything**. We solve this by writing changes to `localStorage` and merging them on every read:
   - New products (negative IDs) appear **first** in the merged list
   - Edited fields overlay the API response (so the edit is instantly visible everywhere)
   - Deleted IDs are filtered out of the merged list
   - This survives page refresh, giving the realistic feel of a "working" write API

3. **Invalid URL values never crash the page**
   All URL params go through `parsePage`, `parsePageSize`, `parseSort`, `parseNumber`, which clamp, default, or discard bad values (e.g. `page=abc` → 1, `sort=bogus` → default/none). This matches the requirement: *"Wrong URL values … must not break the page."*

4. **Fast typists should never see stale results**
   `useLatestAsync` wraps any async function and assigns it a monotonically increasing request ID. If a newer call is made before the previous one resolves, the stale resolved value is silently discarded (return `null`), and the state updater only runs for the most recent request. You can test this by adding `&delay=2000` to the API calls temporarily and typing quickly.

## 🔧 Problem I Faced (and How I Fixed It)

### Stale search responses overwriting newer ones

The classic debounce only delays the request — it doesn't help if two requests are already in flight and the slower one comes back *after* the faster one. At first I only had the 400ms debounce, but in testing over slow Wi‑Fi I saw old "iph" results overwrite newer "iphone" results.

**Fix:** I wrote `useLatestAsync` which tags every call with an incrementing counter (`requestIdRef`). Before the call starts, `++requestIdRef.current` is captured; on resolution, we compare to the *current* value of the ref and discard the result if they don't match. Combined with the debounce on the input, this gives a complete solution: debounce at the entry, then cancellation-at-result-time for any overlapping in-flight calls.

## 🤖 Where AI Helped

- **Initial project scaffolding** (Next.js + TS + Tailwind folder layout, `tsconfig.json` conventions, base `tailwind.config.ts`), so I could get into the product-specific logic quickly
- **SVG icon markup** for the star rating, sorting arrows, view/edit/delete action icons — I re-used the Heroicons style and tuned sizes to match the UI scale
- **First pass of Tailwind utility classes** for the Login page hero gradient and the product card hover states — then iterated by eye to get spacing and elevation right
- **README structure** (headings order, feature matrix), then I filled in the actual decisions, stack, and the "problem I faced" section manually

## 🌐 Deploy

The project is deployable out of the box on Vercel (Next.js zero-config). Just:

```bash
# Optional: build locally first
npm run build

# Install vercel CLI or push to GitHub + Vercel import
vercel
```

Netlify also works using `@netlify/plugin-nextjs`.

## ✅ Completed Checklist

- [x] Login with `emilys` / `emilyspass` (POST `/auth/login`)
- [x] Wrong credentials show error; session persists via token in localStorage
- [x] Protected routes; logout button
- [x] Product list with image, title, category, price, rating, stock
- [x] Table on desktop, cards on mobile
- [x] Pagination (limit/skip from API, Prev/Next, page numbers, 10/20/50 sizes, "Showing X–Y of Z")
- [x] Debounced search with page-reset, no stale overwrites
- [x] Category filter (from `/products/categories`)
- [x] Sort by price / rating / title, asc/desc toggle
- [x] All state in URL query string
- [x] `/products/[id]` details page with images, description, price, reviews
- [x] "Product not found" for invalid IDs + global 404
- [x] Add product form with validation
- [x] Edit product form with validation
- [x] Delete confirmation popup
- [x] Optimistic add/edit/delete (API doesn't persist)
- [x] Loading, empty, and error states throughout
- [x] Retry button on errors
- [x] Axios instance with shared auth header + shared error handling
- [x] API calls in `services/` files, not in UI
- [x] No React Query / SWR / table libraries
- [x] `?page=abc` and `?page=9999` handled without breaking
- [x] Submit-once guards on all forms (no duplicate requests)
