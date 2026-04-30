# 🚀 Quick Start Guide — SNHRC Asset Management

## For Your Friend: Run in 3 Steps

> **No WAMP/XAMPP needed.** Just PHP, Node.js, and PostgreSQL.

---

### Prerequisites Checklist

Before starting, make sure these are installed:

- [ ] **Node.js** (v18+) → [Download](https://nodejs.org/)
- [ ] **PHP** (v7.4+) → [Download](https://www.php.net/downloads)
- [ ] **Composer** → [Download](https://getcomposer.org/download/)
- [ ] **PostgreSQL** (v14+) → [Download](https://www.postgresql.org/download/)

---

### ⚡ QUICK SETUP (5 minutes)

#### 1️⃣ Database

Open **pgAdmin** (comes with PostgreSQL):

1. Right-click "Databases" → Create → Database → Name: `snhrc` → Save
2. Click on `snhrc` → Open **Query Tool**
3. Open file `backend/database/schema.sql` → Click ▶ Run
4. Open file `backend/database/seed.sql` → Click ▶ Run

#### 2️⃣ Backend

```bash
cd backend
composer install
cp .env.example .env
```

Edit `.env` → change `DB_PASSWORD=YOUR_PASSWORD_HERE` to your PostgreSQL password.

#### 3️⃣ Frontend

```bash
cd ..
npm install
```

---

### ▶️ RUN THE APP (2 Terminals)

**Terminal 1:**
```bash
cd backend
php -S localhost:8000
```

**Terminal 2:**
```bash
npm run dev
```

---

### 🌐 Open Browser

Go to: **http://localhost:8080**

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

### ✅ That's it! You should see the Dashboard. 🎉

---

## 📖 User Guide (How to Use the System)

### 🔐 Login
1. Open the app URL in your browser
2. Enter your username and password
3. Click **Login**

### 📊 Dashboard
- After login, you land on the **Dashboard**
- View total assets, active assets, warranty alerts
- Charts show assets by category and branch
- Recent activity feed shows latest actions

### 🔎 Track an Asset
1. Click **Material Tracking** in the sidebar
2. Choose tab: **Barcode**, **Serial Number**, or **Asset Code**
3. Type or scan the identifier
4. Click **Track**
5. View full asset details — location, warranty, history

### 📦 View All Assets
1. Click **Asset Registry** in the sidebar
2. Browse the table with all assets
3. Use filters (status, branch, category) to narrow down
4. Use search box for quick lookup

### ➕ Add New Asset
1. Click **Add Asset** in the sidebar
2. Fill in all required fields:
   - Asset Code, Name, Category
   - Branch, Department
   - Barcode, Serial Number
   - Purchase Date, Cost, Warranty
3. Click **Save**

### 🔄 Transfer an Asset
1. Click **Material Transfer** in the sidebar
2. Click **New Transfer**
3. Select asset, destination branch & department
4. Add reason for transfer
5. Click **Submit**
6. Admin can later **Complete** or **Cancel** the transfer

### 🏢 Manage Branches & Departments
1. Click **Branch Master** or **Department Master**
2. View existing entries
3. Click **Add** to create new
4. Click **Edit** to modify

### 📋 Reports
1. Click **Reports** in the sidebar
2. View warranty reports, branch-wise reports, transfer history
3. Use filters for date range and category

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Unable to connect to server" | Make sure PHP backend is running (`php -S localhost:8000`) |
| CORS error in console | Add your frontend port to `CORS_ALLOWED_ORIGINS` in `backend/.env`, then restart PHP |
| Login fails | Check PostgreSQL is running and seed data was imported |
| Blank dashboard | Check browser console for errors. Backend might not be running |
| "php not recognized" | Add PHP to your system PATH variable |

---

## 📞 Support

If you face any issues:
1. Check the **Common Issues** section in `README.md`
2. Make sure all 3 services are running (PostgreSQL + PHP + Vite)
3. Check browser console (F12) for error messages
