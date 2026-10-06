# LibraX - Smart Library Management System 📚⚡

> A modern, full-stack, production-grade Library Management System designed for academic institutions, research facilities, and community libraries.

![LibraX Banner](https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200)

---

## 🌟 Key Highlights

- **Full-Stack Architecture**: Decoupled React + Vite frontend communicating with a high-performance Node.js / Express.js REST API and MySQL database.
- **Role-Based Access Control (RBAC)**: Distinct, protected portals for **Admin / Librarians** and **Students / Members** enforced with JWT authentication and bcrypt password hashing.
- **Circulation & Lending Engine**: 
  - Real-time book checkouts and returns.
  - Automatic inventory adjustments (`total_copies`, `available_copies`).
  - Active loan restrictions and student borrowing limits.
- **Dynamic Overdue & Fine Management**: Configurable daily overdue fines (default ₹5/day after due date) calculated automatically upon return, with payment tracking and receipts.
- **First-Come, First-Served Reservation Queue**: Students can reserve checked-out titles; when returned, the system automatically notifies the next student in the queue.
- **Digital QR Code Tagging**: Generate and print high-resolution QR tags containing ISBN, title, shelf location, and direct catalog URLs.
- **Interactive Dashboards & Reports**: Real-time KPI summaries, circulation volume area charts, genre distribution pie charts, in-demand title bars, and CSV audit export.
- **Modern SaaS Aesthetics**: Built with Tailwind CSS, dark/light theme toggle, custom scrollbars, glassmorphism, responsive mobile drawer, and accessible components.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Node.js (v20+), Express.js, JWT (`jsonwebtoken`), bcryptjs, QRCode, CORS, Dotenv |
| **Database** | MySQL 8.x / MariaDB, `mysql2` connection pool with parameterized queries |
| **Tooling** | PostCSS, Autoprefixer, Nodemon |

---

## 📁 Project Structure

```
library-management-system/
├── client/                     # Frontend Single Page Application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable design system
│   │   │   ├── common/         # Badge, Button, Card, Modal, Pagination, QR, etc.
│   │   │   └── layout/         # AppLayout, Navbar, Sidebar, ProtectedRoute
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── admin/          # Dashboard, Books, Categories, Students, Circulation, etc.
│   │   │   ├── student/        # StudentDashboard, BookCatalog, MyBooks, Reservations, Fines, Profile
│   │   │   ├── BookDetails.jsx # Universal Book Page with QR & Reservation
│   │   │   └── NotFound.jsx    # 404 page
│   │   ├── services/           # Axios instance & API client modules
│   │   ├── App.jsx             # Route definitions & guards
│   │   ├── main.jsx            # React root entry
│   │   └── index.css           # Tailwind & modern styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend REST API Server
│   ├── src/
│   │   ├── config/             # MySQL pool (db.js) & JWT generator (jwt.js)
│   │   ├── controllers/        # Business logic for all 11 domains
│   │   ├── middleware/         # JWT verification, Role authorization, Error handler
│   │   ├── routes/             # Express API routing
│   │   ├── services/           # Notification & queue services
│   │   ├── utils/              # Fine calculator, Database seed, Test suite
│   │   └── server.js           # Server bootstrap & healthcheck
│   ├── .env                    # Environment secrets
│   ├── .env.example            # Environment template
│   └── package.json
│
├── database/
│   └── schema.sql              # MySQL schema & realistic production seed dataset
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start & Prerequisites

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+
- **MySQL Server** (running locally or remotely on port 3306)

---

### 2. Database Setup

1. Make sure your MySQL service is running:
   ```bash
   # On macOS (Homebrew)
   brew services start mysql
   ```

2. Run the database seed script to automatically create `library_management` and populate it with realistic seed data:
   ```bash
   cd server
   npm run seed
   ```

*(Alternatively, you can manually import `database/schema.sql` via MySQL CLI or phpMyAdmin: `mysql -u root -p < database/schema.sql`)*

---

### 3. Server Configuration (.env)

Navigate to `server/` and verify or create `.env`:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=library_management
JWT_SECRET=librax_super_secret_jwt_key_2026_modern_production
JWT_EXPIRES_IN=7d
```

Start the backend API server:
```bash
cd server
npm start
# or for auto-reloading development:
npm run dev
```
> The API will be active at: `http://localhost:5001`

---

### 4. Frontend Setup

Navigate to `client/` and start the development server:
```bash
cd client
npm install
npm run dev
```
> The web application will launch at: `http://localhost:3000`

---

## 🔑 Default Credentials

> **IMPORTANT**: These accounts are automatically seeded for testing. Change passwords after your first deployment!

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Administrator / Librarian** | `admin@librax.com` | `Admin@123` | Full circulation desk, book management, students, categories, fines, reports, system settings. |
| **Student Member** | `sarah.j@student.edu` | `Student@123` | Browse catalog, check active loans, view borrowing history, place reservations, view fines. |
| **Student Member (Alternate)** | `alex.r@student.edu` | `Student@123` | Student portal testing. |

*(The login page includes convenient **1-Click Demo Fill** buttons for immediate testing).*

---

## 🔄 End-to-End Automated Testing

LibraX includes a built-in automated test suite verifying all 20+ operations including authentication, role enforcement, book checkout, overdue calculations, and stock consistency:

```bash
cd server
node src/utils/testSuite.js
```

Expected output:
```text
====================================================
🚀 [LibraX Test Suite] Running End-to-End API Tests
====================================================
  ✅ PASS: Server health check is online
  ✅ PASS: Admin login succeeded
  ✅ PASS: Admin role verified in token response
  ✅ PASS: Student login succeeded
  ✅ PASS: Admin stats retrieved successfully
  ✅ PASS: Student stats retrieved successfully
  ✅ PASS: Books catalog query returned
  ✅ PASS: QR code generated for book
  ✅ PASS: Forbidden 403 correctly returned for unauthorized student action
  ✅ PASS: Book created with 201 Created
  ✅ PASS: Book issued successfully
  ✅ PASS: Available copies decremented from 5 to 4
  ✅ PASS: Book returned successfully
  ✅ PASS: Available copies restored to 5
  ✅ PASS: Test book cleaned up and deleted
  ✅ PASS: Circulation settings retrieved
====================================================
🏁 [Test Suite Complete] Passed: 22 | Failed: 0
====================================================
```

---

## 📖 API Documentation Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create student member account
- `POST /api/auth/login` - Authenticate user & generate JWT
- `GET  /api/auth/me` - Fetch profile of active authenticated session
- `PUT  /api/auth/profile` - Update user details
- `PUT  /api/auth/change-password` - Update account password

### Books Catalog (`/api/books`)
- `GET    /api/books` - Search & filter books (supports `search`, `category`, `availability`, `sortBy`, `page`, `limit`)
- `GET    /api/books/:id` - Fetch detailed book record with reservation waitlist count
- `GET    /api/books/:id/qrcode` - Generate base64 QR tag
- `POST   /api/books` - *(Admin)* Create new title
- `PUT    /api/books/:id` - *(Admin)* Edit book metadata & copy counts
- `DELETE /api/books/:id` - *(Admin)* Delete title (blocked if active loans exist)

### Circulation Desk (`/api/transactions`)
- `POST /api/transactions/issue` - *(Admin)* Issue book to student with validation
- `POST /api/transactions/return` - *(Admin)* Process return, assess fine if overdue, notify reservation queue
- `GET  /api/transactions` - Fetch circulation records (filtered by user or status)

### Reservations (`/api/reservations`)
- `POST   /api/reservations` - Place book hold
- `GET    /api/reservations` - List reservation queue
- `PUT    /api/reservations/:id` - Update status (`WAITING`, `FULFILLED`, `CANCELLED`)

### Fines Ledger (`/api/fines`)
- `GET /api/fines` - List all fine records
- `GET /api/fines/stats` - Summary of pending vs collected fines
- `PUT /api/fines/:id/pay` - *(Admin)* Mark fine as collected / paid

### Reports & Settings (`/api/reports`, `/api/settings`)
- `GET /api/dashboard/stats` - Real-time metrics and Recharts dataset
- `GET /api/reports` - Audit report with date range filters
- `GET /api/settings` & `PUT /api/settings` - Circulation rules configuration

---

## 🛡️ Security Best Practices Implemented

- **Password Hashing**: Strong bcrypt salt rounds (10) for all user accounts.
- **JWT Protection**: Cryptographically signed bearer tokens with configurable expiration (`7d`).
- **SQL Injection Prevention**: All queries use parameterized statements with `mysql2/promise`.
- **RBAC**: Middleware verifies permissions before granting administrative mutation capabilities.
- **Rate & Error Obfuscation**: Centralized error middleware prevents database schema leaks to clients.

---

## 📄 License

This project is licensed under the MIT License.
