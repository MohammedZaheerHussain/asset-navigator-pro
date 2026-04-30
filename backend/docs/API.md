# SNHRC Asset Management System — API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication

### POST `/api/auth/login`
**Auth:** None

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@snhrc.org",
      "full_name": "System Administrator",
      "role": "admin"
    }
  }
}
```

### POST `/api/auth/register` *(Admin Only)*
**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@snhrc.org",
  "password": "password123",
  "full_name": "New User",
  "role": "staff"
}
```

### GET `/api/auth/profile`
Returns the authenticated user's profile.

---

## 2. Material Tracking (CRITICAL)

### GET `/api/track?type={type}&value={value}`
**Auth:** Required

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | No | `barcode`, `serial`, `assetCode`, or `auto` (default) |
| value | string | Yes | The search value (barcode, serial number, or asset code) |

**Example:** `GET /api/track?type=barcode&value=BAR001MRI2024`

**Response (200):**
```json
{
  "success": true,
  "message": "Asset found",
  "data": {
    "asset_code": "AST-MED-001",
    "name": "Philips MRI Scanner",
    "category": "Medical Equipment",
    "location": {
      "branch": "SNHRC Main Hospital",
      "branch_code": "SNHRC-MAIN",
      "department": "Radiology",
      "department_code": "RAD"
    },
    "status": "active",
    "assigned_to": "Dr. Arun Patel",
    "warranty": {
      "expiry": "2028-06-15",
      "status": "active",
      "days_remaining": 780
    },
    "last_updated": "2024-01-15 10:30:00",
    "transfer_history": [],
    "activity_log": []
  }
}
```

---

## 3. Assets

### GET `/api/assets`
**Query Parameters:** `page`, `per_page`, `status`, `category_id`, `branch_id`, `department_id`, `search`

### POST `/api/assets`
**Request Body:**
```json
{
  "asset_code": "AST-NEW-001",
  "name": "New Equipment",
  "category_id": 1,
  "branch_id": 1,
  "department_id": 1,
  "barcode": "BARNEW001",
  "serial_number": "SN-NEW-001",
  "status": "active",
  "assigned_to": "John Doe",
  "warranty_expiry": "2027-01-01",
  "purchase_date": "2024-01-01",
  "purchase_cost": 50000.00
}
```

### GET `/api/assets/{code}`
### PUT `/api/assets/{code}`
### DELETE `/api/assets/{code}` *(Admin Only, Soft Delete)*

---

## 4. Dashboard

### GET `/api/dashboard/stats`
```json
{
  "data": {
    "total_assets": 12,
    "active_assets": 9,
    "expiring_warranties": 2,
    "assets_in_transfer": 1,
    "maintenance_assets": 1,
    "active_transfers": 1
  }
}
```

### GET `/api/dashboard/assets-by-category`
### GET `/api/dashboard/assets-by-branch`
### GET `/api/dashboard/recent-activity?limit=20`
### GET `/api/dashboard/expiring-warranties?days=90`

---

## 5. Transfers

### GET `/api/transfers` — List transfers (filterable by `status`, `asset_code`)
### POST `/api/transfers` — Initiate transfer
```json
{
  "asset_code": "AST-MED-002",
  "to_branch_id": 3,
  "to_department_id": 10,
  "reason": "Equipment needed in Pediatrics"
}
```
### GET `/api/transfers/{id}` — Transfer details
### PUT `/api/transfers/{id}/complete` — Complete transfer
### PUT `/api/transfers/{id}/cancel` — Cancel transfer
### GET `/api/transfers/asset/{code}` — Asset transfer history

---

## 6. Master Data

### Branches
- `GET /api/branches` — List all branches
- `POST /api/branches` *(Admin)* — Create branch
- `GET /api/branches/{id}` — Get branch
- `PUT /api/branches/{id}` *(Admin)* — Update branch

### Departments
- `GET /api/departments?branch_id={id}` — List departments (filterable by branch)
- `POST /api/departments` *(Admin)* — Create department
- `GET /api/departments/{id}` — Get department
- `PUT /api/departments/{id}` *(Admin)* — Update department

### Categories
- `GET /api/categories` — List all categories
- `POST /api/categories` *(Admin)* — Create category
- `PUT /api/categories/{id}` *(Admin)* — Update category

---

## 7. Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Asset not found",
  "error_code": 404
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error_code": 422,
  "errors": {
    "name": ["name is required"],
    "category_id": ["category_id must be an integer"]
  }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "per_page": 20,
    "current_page": 1,
    "last_page": 3,
    "from": 1,
    "to": 20
  }
}
```

---

## 8. Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (Admin required) |
| 404 | Not Found |
| 409 | Conflict (Duplicate) |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## Default Login Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| staff1 | admin123 | Staff |
| staff2 | admin123 | Staff |
