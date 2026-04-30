# 🏥 SNHRC Asset Management System

A production-grade, full-stack Asset Management System built for **Sri Narayani Hospital & Research Centre** to track, manage, and monitor assets across multiple branches and departments.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [System Requirements](#-system-requirements)
- [Project Setup](#-project-setup-step-by-step)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Database Setup (PostgreSQL)](#step-2-database-setup-postgresql)
  - [Step 3: Backend Setup (PHP)](#step-3-backend-setup-php-api)
  - [Step 4: Frontend Setup (React)](#step-4-frontend-setup-react)
- [Running the Application](#-running-the-application)
- [Default Login Credentials](#-default-login-credentials)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [How the System Works](#-how-the-system-works)
- [Common Issues & Fixes](#-common-issues--fixes)
- [Verification Checklist](#-verification-checklist)

---

## 🔍 Project Overview

This system enables hospital administrators to:
- **Track assets** instantly using barcode scanner, serial number, or asset code
- **Manage assets** across multiple branches and departments
- **Monitor warranties** and get expiry alerts
- **Handle transfers** between branches with full audit trail
- **View real-time dashboards** with analytics and insights

---

## ⭐ Core Features

| Feature | Description |
|---------|-------------|
| 🔎 Smart Tracking | Auto-detects barcode / serial number / asset code |
| 📊 Dashboard | Real-time KPIs, charts, warranty alerts |
| 📦 Asset CRUD | Create, Read, Update, Delete assets |
| 🏢 Branch Management | Multi-branch & department support |
| 🔄 Material Transfer | Transfer assets between branches with history |
| 🔐 Authentication | JWT-based login with role-based access |
| 👥 Role-Based Access | Admin (full access) & Staff (limited access) |
| 📱 Barcode Scanner | Hardware scanner support via keyboard input |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **State Management** | Redux Toolkit (RTK Query) |
| **UI Components** | Radix UI + Tailwind CSS |
| **Charts** | Recharts |
| **Backend** | PHP 7.4+ (REST API) |
| **Database** | PostgreSQL 14+ |
| **Authentication** | JWT (firebase/php-jwt) |
| **Environment** | vlucas/phpdotenv |

---

## 🏗 Architecture

```
┌──────────────────┐     HTTP/JSON      ┌─────────────────┐     SQL      ┌──────────────┐
│   React Frontend │ ──────────────────→ │   PHP REST API  │ ──────────→ │  PostgreSQL   │
│   (Port 8080)    │ ←────────────────── │   (Port 8000)   │ ←────────── │  Database     │
│                  │    JWT Auth Token   │                 │             │  (snhrc)      │
└──────────────────┘                     └─────────────────┘             └──────────────┘
```

> **⚠️ Do we need WAMP/XAMPP?**
>
> **NO!** This project uses PHP's built-in development server (`php -S localhost:8000`).
> No Apache, no WAMP, no XAMPP required. Works directly on Windows and macOS.

---

## 💻 System Requirements

### Required

| Software | Version | Check Command |
|----------|---------|---------------|
| **Node.js** | v18+ | `node --version` |
| **npm** | v9+ | `npm --version` |
| **PHP** | v7.4+ | `php --version` |
| **Composer** | v2+ | `composer --version` |
| **PostgreSQL** | v14+ | `psql --version` |
| **Git** | Latest | `git --version` |

### PHP Extensions Required
- `pdo_pgsql` (PostgreSQL driver)
- `json`
- `openssl`
- `mbstring`

**Check PHP extensions:**
```bash
php -m | grep -i pgsql
```

### Optional (Recommended)
- **pgAdmin 4** — GUI for PostgreSQL management
- **Postman** — API testing

---

## 🚀 Project Setup (Step-by-Step)

### Step 1: Clone Repository

```bash
git clone <repo-url>
cd asset-navigator-pro-main/asset-navigator-pro-main
```

---

### Step 2: Database Setup (PostgreSQL)

#### 2a. Create the database

**Using pgAdmin:**
- Open pgAdmin → Right click "Databases" → Create → Database
- Name: `snhrc`
- Owner: `postgres`

**Using terminal (psql):**

```bash
# Windows (find psql path first)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# macOS
psql -U postgres
```

```sql
CREATE DATABASE snhrc;
\q
```

#### 2b. Import schema (creates all tables)

```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d snhrc -f backend/database/schema.sql

# macOS
psql -U postgres -d snhrc -f backend/database/schema.sql
```

#### 2c. Import seed data (sample data + admin user)

```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d snhrc -f backend/database/seed.sql

# macOS
psql -U postgres -d snhrc -f backend/database/seed.sql
```

**OR** using pgAdmin:
1. Open pgAdmin → Select `snhrc` database
2. Click Query Tool
3. Open and run `backend/database/schema.sql`
4. Then open and run `backend/database/seed.sql`

#### 2d. Verify tables were created

```sql
\dt
```

You should see these 7 tables:
| Table |
|-------|
| `users` |
| `assets` |
| `branches` |
| `departments` |
| `categories` |
| `transfers` |
| `activity_logs` |

---

### Step 3: Backend Setup (PHP API)

#### 3a. Navigate to backend folder

```bash
cd backend
```

#### 3b. Install PHP dependencies

```bash
composer install
```

#### 3c. Configure environment variables

Copy the example env file:
```bash
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
# Application
APP_NAME="SNHRC Asset Management"
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_PORT=8000

# Database (PostgreSQL) — UPDATE THESE!
DB_DRIVER=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=snhrc
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

# JWT Authentication
JWT_SECRET=snhrc-asset-mgmt-jwt-secret-2024-change-in-production
JWT_EXPIRY=3600

# CORS (allowed frontend origins)
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

> **⚠️ Important:** Change `DB_PASSWORD` to your actual PostgreSQL password!

#### 3d. Start the backend server

```bash
php -S localhost:8000
```

You should see:
```
PHP Development Server (http://localhost:8000) started
```

#### 3e. Verify the API is running

Open in browser: **http://localhost:8000/api/health**

Expected response:
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "running",
    "version": "1.0.0"
  }
}
```

---

### Step 4: Frontend Setup (React)

#### 4a. Navigate to project root (go back from backend)

```bash
cd ..
```

#### 4b. Install Node.js dependencies

```bash
npm install
```

#### 4c. Start the frontend dev server

```bash
npm run dev
```

You should see:
```
VITE ready in 2000 ms
→ Local: http://localhost:8080/
```

#### 4d. Open in browser

Navigate to: **http://localhost:8080**

---

## 🎯 Running the Application

You need **2 terminals** running simultaneously:

### Terminal 1 — Backend (PHP API)
```bash
cd backend
php -S localhost:8000
```
✅ API running at `http://localhost:8000`

### Terminal 2 — Frontend (React)
```bash
npm run dev
```
✅ App running at `http://localhost:8080`

---

## 🔑 Default Login Credentials

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| `admin` | `admin123` | Admin | Full access (all modules) |
| `staff1` | `admin123` | Staff | View-only (dashboard, tracking) |
| `staff2` | `admin123` | Staff | View-only (dashboard, tracking) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | User login | ❌ |
| `GET` | `/api/auth/profile` | Get logged-in user profile | ✅ |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | KPI statistics |
| `GET` | `/api/dashboard/assets-by-category` | Category-wise chart |
| `GET` | `/api/dashboard/assets-by-branch` | Branch-wise chart |
| `GET` | `/api/dashboard/recent-activity` | Activity feed |
| `GET` | `/api/dashboard/expiring-warranties` | Warranty alerts |

### Smart Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/track?value=AST-MED-001` | Auto-detects barcode/serial/code |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assets?page=1&per_page=20` | List (paginated + filters) |
| `POST` | `/api/assets` | Create new asset |
| `GET` | `/api/assets/{code}` | Get single asset |
| `PUT` | `/api/assets/{code}` | Update asset |
| `DELETE` | `/api/assets/{code}` | Soft-delete (Admin only) |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transfers` | List all transfers |
| `POST` | `/api/transfers` | Initiate new transfer |
| `PUT` | `/api/transfers/{id}/complete` | Mark transfer complete |
| `PUT` | `/api/transfers/{id}/cancel` | Cancel transfer |

### Master Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/branches` | List / Create branches |
| `GET/POST` | `/api/departments` | List / Create departments |
| `GET/POST` | `/api/categories` | List / Create categories |

---

## 📁 Project Structure

```
asset-navigator-pro-main/
│
├── src/                          # 🎨 FRONTEND (React + TypeScript)
│   ├── components/               #    Reusable UI components
│   │   ├── layout/               #    AppLayout, Sidebar, Header
│   │   └── ui/                   #    Button, Card, Dialog, etc.
│   ├── pages/                    #    Page components
│   │   ├── Login.tsx             #    Login page
│   │   ├── Dashboard.tsx         #    Main dashboard
│   │   ├── MaterialTracking.tsx  #    Asset tracking
│   │   ├── AssetRegistry.tsx     #    Asset list + filters
│   │   ├── AddAsset.tsx          #    New asset form
│   │   ├── MaterialTransfer.tsx  #    Transfer management
│   │   ├── BranchMaster.tsx      #    Branch CRUD
│   │   ├── DepartmentMaster.tsx  #    Department CRUD
│   │   └── Reports.tsx           #    Reports module
│   ├── store/
│   │   ├── apiSlice.ts           #    RTK Query (ALL API calls)
│   │   └── index.ts              #    Redux store config
│   ├── lib/
│   │   └── tracking-service.ts   #    Tracking logic helper
│   └── App.tsx                   #    Routes & app shell
│
├── backend/                      # ⚙️ BACKEND (PHP REST API)
│   ├── src/
│   │   ├── Controllers/          #    Route handlers
│   │   │   ├── AuthController.php
│   │   │   ├── AssetController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── TrackingController.php
│   │   │   ├── TransferController.php
│   │   │   ├── BranchController.php
│   │   │   ├── DepartmentController.php
│   │   │   └── CategoryController.php
│   │   ├── Services/             #    Business logic
│   │   ├── Models/               #    Database models (PDO)
│   │   ├── Middleware/           #    Auth & CORS middleware
│   │   │   ├── AuthMiddleware.php    # JWT verification
│   │   │   ├── AdminMiddleware.php   # Admin role check
│   │   │   └── CorsMiddleware.php    # CORS headers
│   │   ├── Core/                 #    Framework core
│   │   │   ├── App.php           #    Bootstrap
│   │   │   ├── Router.php        #    HTTP router
│   │   │   ├── Request.php       #    Request parser
│   │   │   ├── Response.php      #    JSON responses
│   │   │   ├── Database.php      #    PDO connection
│   │   │   └── Validator.php     #    Input validation
│   │   └── Routes/
│   │       └── api.php           #    All route definitions
│   ├── database/
│   │   ├── schema.sql            #    Table definitions
│   │   └── seed.sql              #    Sample data
│   ├── .env                      #    Environment config
│   ├── composer.json             #    PHP dependencies
│   └── index.php                 #    Entry point
│
├── package.json                  #    Frontend dependencies
├── vite.config.ts                #    Vite configuration
├── tailwind.config.ts            #    Tailwind CSS config
└── tsconfig.json                 #    TypeScript config
```

---

## ⚙️ How the System Works

```
1. User opens http://localhost:8080
                    │
2. Login page → enters username/password
                    │
3. Frontend sends POST /api/auth/login
                    │
4. Backend validates credentials against PostgreSQL
                    │
5. Returns JWT token + user info
                    │
6. Token stored in localStorage
                    │
7. All subsequent API calls include token in header:
   Authorization: Bearer <token>
                    │
8. Backend validates token on every request
                    │
9. Data fetched from PostgreSQL → returned as JSON
                    │
10. RTK Query caches data & auto-updates UI
```

---

## 🔧 Common Issues & Fixes

### ❌ "PHP is not recognized"
**Cause:** PHP not in system PATH

**Fix (Windows):**
- Add PHP to PATH: `C:\php` or wherever PHP is installed
- Or use full path: `C:\php\php.exe -S localhost:8000`

**Fix (macOS):**
```bash
brew install php
```

---

### ❌ "composer is not recognized"
**Fix:** Install Composer from https://getcomposer.org/download/

---

### ❌ Backend starts but API returns errors
**Cause:** Database not connected

**Fix:**
1. Check PostgreSQL is running
2. Verify `backend/.env` credentials
3. Ensure `pdo_pgsql` extension is enabled in `php.ini`

```bash
php -m | grep pgsql
```

If not shown, enable in `php.ini`:
```ini
extension=pdo_pgsql
extension=pgsql
```

---

### ❌ CORS Error in browser console
**Cause:** Frontend port not whitelisted

**Fix:** Add your frontend port to `backend/.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:5173
```
Then restart the PHP server.

---

### ❌ "Port 8080 is in use"
**Cause:** Another app using port 8080

**Fix:** Vite will auto-pick the next available port (8081, 8082, etc.)
Just use whatever URL Vite shows in the terminal.

---

### ❌ "npm install" fails
**Fix:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Verification Checklist

After setup, verify everything works:

| Check | How to Test | Expected Result |
|-------|-------------|----------------|
| API Health | Visit `http://localhost:8000/api/health` | `{"success": true}` |
| Login | Enter `admin` / `admin123` | Redirects to dashboard |
| Dashboard | Check KPI cards | Shows total assets: 12 |
| Tracking | Search `AST-MED-001` | Shows "Philips MRI Scanner" |
| Asset List | Go to Asset Registry | Table with 12 assets |
| Branches | Go to Branch Master | 4 branches listed |
| No Errors | Open browser DevTools Console | No red errors |

---

## 📝 Important Notes

1. **No WAMP/XAMPP needed** — PHP built-in server handles everything
2. **Keep both terminals running** — Backend (PHP) + Frontend (Vite) simultaneously
3. **PostgreSQL must be running** before starting the backend
4. **Frontend port may vary** — If 8080 is busy, Vite will auto-assign 8081/8082
5. **Password in .env** — Update `DB_PASSWORD` to match YOUR PostgreSQL password
6. **JWT token expires** in 1 hour — Re-login if you see 401 errors

---

## 👨‍💻 Development Commands

```bash
# Start frontend dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Start backend
cd backend && php -S localhost:8000
```

---

**Built with ❤️ for SNHRC**
