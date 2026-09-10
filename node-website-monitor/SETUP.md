# Setup Guide: Website Monitoring Module (Node.js/Express + React/Tailwind)

This module provides a complete website monitoring portal inside the workspace:
1. **Uptime & Error Logs Monitor**: 24/7 background checks, DNS resolution timers, SSL certificate expiry handshakers.
2. **WordPress SRE Diagnostics**: REST API crawlers, plug-in/theme updates status trackers, conflict checkers, and database vulnerability scanners.

---

## 📂 Proposing Folder Layout

The module consists of the following folder layout under `node-website-monitor/`:
- **`backend/`**: Express server bootstrap, Mongoose/MongoDB Schemas, Cron schedulers, and Crawler controllers.
- **`frontend/`**: React SPA styled with Tailwind CSS, Recharts plots, and Lucide React icons.

---

## ⚡ Prerequisite Software
- Ensure you have **Node.js 16+** (which bundles npm) installed.
- Ensure a local instance of **MongoDB** is running on your system (Default port `27017` is used).

---

## 📦 Required npm Packages

### Backend Dependencies
We already configured these inside the backend `package.json`:
- `express`: Main API framework.
- `mongoose`: MongoDB ORM layer.
- `axios`: HTTP request engine.
- `dotenv`: Environmental variables parser.
- `cors`: Cross-origin bindings.
- `node-cron`: Periodic background audit scheduler.
- `nodemon` (devDependencies): Live-reload backend compiler.

### Frontend Dependencies
We already configured these inside the frontend `package.json`:
- `react`, `react-dom`: core library.
- `recharts`: Sleek rendering curves.
- `lucide-react`: High-fidelity vector SRE icons.
- `tailwindcss`, `autoprefixer`, `postcss`: Styling compiler.
- `vite` (devDependencies): Lightning-fast bundler.

---

## 🚀 Step-by-Step Launch Guide

### Step 1: Initialize Database Connection
Ensure MongoDB is running locally:
```bash
# Verify connection using mongosh or similar
mongosh
```

### Step 2: Initialize & Launch Express Backend
1. Open a new terminal session and navigate to the backend directory:
   ```bash
   cd node-website-monitor/backend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the server using dev reload:
   ```bash
   npm run dev
   ```
- *Upon first startup, the database is automatically seeded with 20 historical status checks, WordPress plugin diagnostic states, and SRE alerts!*

### Step 3: Initialize & Launch React Frontend
1. Open a second terminal session and navigate to the frontend directory:
   ```bash
   cd node-website-monitor/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Click or navigate to **`http://localhost:5173`** inside your web browser to enjoy the gorgeous SRE dark theme dashboard!

---

## 📡 Sample JSON API Responses

### 1. GET `/api/stats?url=https://wordpress.org`
```json
{
  "url": "https://wordpress.org",
  "uptimePercentage": 95,
  "totalChecks": 20,
  "latestStatus": {
    "url": "https://wordpress.org",
    "isUp": true,
    "statusCode": 200,
    "loadTimeMs": 420,
    "ttfbMs": 110,
    "dnsResolutionTimeMs": 18,
    "ssl": {
      "valid": true,
      "daysRemaining": 18,
      "issuer": "DigiCert TLS Hybrid ECC CA1",
      "expiryDate": "2026-06-12T17:00:00.000Z"
    },
    "errors": [],
    "checkedAt": "2026-05-25T16:55:00.000Z"
  },
  "historyLog": [ ... ],
  "wordpress": {
    "url": "https://wordpress.org",
    "healthScore": 78,
    "coreVersion": "6.4.3",
    "hasUpdate": true,
    "plugins": [
      {
        "name": "WooCommerce",
        "slug": "woocommerce",
        "version": "8.1.0",
        "status": "active",
        "hasUpdate": true,
        "hasVulnerability": true,
        "vulnerabilityDetails": "SQL Injection in woolive chat widgets."
      }
    ]
  },
  "activeAlerts": [ ... ]
}
```
