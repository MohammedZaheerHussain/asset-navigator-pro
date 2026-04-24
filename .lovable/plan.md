
# Hospital Asset Intelligence & Lifecycle Management System

A modern, enterprise-grade internal web UI for multi-branch hospital asset and material management. Static UI (mocked data, no backend), built for clarity, speed, and lifecycle visibility.

## Design System

- **Primary:** Soft Orange `#F28C38` · **Background:** White + Light Grey `#F5F6F8` · **Accent:** Muted teal/blue
- **Status colors:** Green (healthy/valid/active) · Yellow (warning/expiring/maintenance) · Red (critical/expired) · Blue (in transfer) · Grey (retired)
- **Typography:** Inter · Rounded cards · Soft shadows · Search-enabled dropdowns · Toggle switches
- All colors registered as HSL tokens in `index.css` + Tailwind config — no hardcoded colors in components

## Standardized Status System (used everywhere)

- **Asset Status:** Active (green) · In Maintenance (yellow) · In Transfer (blue) · Retired (grey)
- **Warranty Status:** Valid (green) · Expiring Soon (yellow) · Expired (red)
- Centralized `StatusBadge` and `WarrantyBadge` components reused across tables, drawers, cards

## Global Layout

- **Top Navbar (fixed):** Logo · Global Search (center) · Notification bell with badge · User profile dropdown showing **Role (Admin/Staff)** and **Last login** timestamp
- **Sidebar (collapsible icon-mini):** Dashboard · Masters (Branch, Department) · Asset Management (Add Asset, Asset Registry) · Tracking · Transactions (Material Transfer) · Equipment (Biomedical, Other) · Reports · Logout
- **Sticky Context Header** on every page: Page title + Breadcrumbs (e.g. `Dashboard / Asset Management / Add Asset`) + page-level actions
- **Floating "Quick Add Asset" FAB** (bottom-right) → compact modal
- **Global Search dropdown** with grouped results: Assets · Branches · Departments. Each result shows name + secondary info (location / status badge)

## Pages

### 1. Dashboard
- 4 KPI cards: Total Assets · Active Assets · Expiring Warranties · Assets in Transfer
- Charts: Assets by Category (donut) · Assets by Branch (bar)
- Warranty Expiry watchlist + Recent Activity table

### 2. Branch Master
- Table (Code · Name · Alias · Actions), modal add/edit, empty state with "Add your first branch" CTA

### 3. Department Master
- Branch selector at top → table filters dynamically
- Modal add/edit, empty state CTA

### 4. Add Asset (priority)
Sectioned card layout with sticky save bar:
1. **Location** — Branch → Department (loads based on Branch) → Room (loads based on Department)
2. **Asset Info** — Category → Item Name (filtered by category) · Description
3. **Product Details** — Make · Model · Serial · Value
4. **Dates** — Purchase · Issue · Warranty Expiry (highlighted)
5. **Alerts** — Enable toggle · Alert message
6. **Additional** — Invoice · Remarks · Child Asset toggle

Confirmation toast on save: *"Asset Added Successfully"*

### 5. Asset Registry
- Filters: Branch · Department · Category · Search
- Table: Asset ID · Name · Category · Location · Status badge · Warranty badge
- Hover row highlight, loading skeletons, empty state ("No assets found" + CTA)
- **Row click → Asset Detail Drawer:**
  - Summary header: Asset Name · Asset ID · Status badge · Warranty badge
  - Tabs: **Overview** · **Location History** · **Warranty & AMC** · **Transfer History**

### 6. Material Tracking
- Segmented search: Barcode · Serial · Asset Code
- Result rendered as structured cards (Location · Asset · Warranty · Alerts) — no raw text
- Empty state before search; "Not found" state with suggestion

### 7. Material Transfer
- Form: From Branch/Dept → To Branch/Dept · Asset picker (with cascading dropdowns)
- Transfer history table below with status badges, empty state "No transfers yet"

### 8. Biomedical & Other Equipment
- Two routes sharing categorized list/table layout with filters and shared drawer

### 9. Reports
- **Predefined report types** as cards: Expiring Warranties · Assets by Department · Transfer Logs · Assets by Branch
- Selecting a report opens filters + table + export buttons (UI only)

## Micro UX Polish
- Row hover states · Loading skeletons on all tables · Toast confirmations on all create/update/delete (sonner) · Smooth drawer/modal transitions · Keyboard-friendly dropdowns

## Tech
React + Vite + Tailwind + shadcn/ui · React Router · Lucide icons · Recharts · sonner toasts · All data mocked, structured for easy backend swap-in
