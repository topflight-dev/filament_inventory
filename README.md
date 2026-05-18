# 🏺 Crafted 3D Printing – Filament Inventory Ecosystem
> A full-stack inventory management, gallery, and print queue solution for 3D printing, featuring a public web interface, a native desktop administrative hub, and secure Supabase integration.

---

## ⚠️ Architectural Constraints & Project Boundaries (Dual-Target Release)
This repository is currently utilizing a **Dual-Target Architecture** designed to simultaneously support compiling the standalone Windows desktop app (`C3DW Hub 1.0.0.exe`) and a responsive web-based Hub interface for tablets and mobile devices.

### Strict Boundaries:
1. **Production Isolation:** The live marketing/business website (`www.crafted3dworkshop.com`) is completely OUT OF SCOPE. No configuration, deployment paths, or code changes should ever impact the live domain.
2. **Database Integrity:** The current Supabase database tables are actively connected to production tools. Schemas, tables, and existing columns are **sacred and immutable**. Any future scaling must be entirely backward-compatible.
3. **Current Working Branch:** All universal web/tablet modifications must be performed inside the `feature/universal-web-target` sandbox branch. The `main` branch must remain pristine for the working desktop build.

---

## 📂 System Architecture
Understanding the purpose and flow of the project:

### 1. Public Facing (Web)
* **`index.html`** – Home and brand introduction page.
* **`inventory.html`** – Real-time filament stock display with dynamic data fetching.
* **`gallery.html`** – High-resolution showcase of completed printed objects.
* **`src/pages/public/request.html`** – Public-facing print queue request form where users can submit new 3D printing jobs directly to the workshop database.

### 2. Administrative Layer (Desktop App)
The administrative layer has been packaged into a native **Electron desktop environment**, running as a standalone, borderless utility app on Windows. This removes the need for a browser-based admin portal and provides a dedicated, always-available dashboard experience.

* **`src/pages/admin/hub.html`** – The administrative print queue dashboard (C3DW Hub). Displays all incoming public print requests, allows status updates, and provides real-time queue management.
  * *Purpose:* Central command for reviewing, managing, and fulfilling submitted print jobs.
  * *Environment:* Runs inside the Electron shell — not served via a web browser.
* **`main.cjs`** – The Electron framework main process controller.
  * *Purpose:* Launches the Admin Hub as a standalone, borderless desktop utility app. Manages the application window lifecycle, IPC communication, and native OS integration.

### 3. Data & Logic
* **`/js/supabase-config.js`** – Centralized initialization for the Supabase client.
* **`/js/inventory.js`** – Handles public data fetching, rendering, and filtering.
* **`/js/admin.js`** – Manages administrative database operations (POST/PATCH/DELETE).
* **`final_build.ps1`** – An administrative automation script used to clean build processes and compile the standalone Windows executable (`C3DW Hub 1.0.0.exe`). Handles lock-file cleanup, dependency checks, and triggers `electron-builder` to produce the final distributable.

---

## 🔐 Database & Security (Supabase)
This project leverages Supabase with **Row Level Security (RLS)** to ensure all data is protected and integrity is maintained.

### Tables & RLS Policies
1. **`colors` Table**
   * **Purpose:** Stores core filament inventory (Color, Finish, Stock Status).
   * **Public Access:** `SELECT` only. Users can view inventory but cannot modify it.
   * **Admin Access:** Full `INSERT`, `UPDATE`, and `DELETE` permissions for authorized sessions.

2. **`site_traffic` Table**
   * **Purpose:** Tracks engagement and site analytics.
   * **Public Access:** `INSERT` only. Allows the site to log visits without exposing logs to the public.
   * **Admin Access:** `SELECT` and `DELETE` for traffic review and maintenance.

3. **`requests` Table** *(Print Queue)*
   * **Purpose:** Stores incoming public print requests submitted via the request form. Fields include Project Name, Filament Link, Status, and submission timestamp.
   * **Public Access:** `INSERT` only. Users can submit new jobs but cannot view or modify the queue.
   * **Admin Access:** Full `SELECT`, `UPDATE`, and `DELETE` for queue management and real-time status tracking via the Hub dashboard.

---

## 🛠 Maintenance & CLI Workflow
Use these commands to manage development, deployment, and the desktop application build pipeline:

### Git & Deployment
* **Check Status:** `git status` (See pending changes).
* **Save Progress:** `git add .` followed by `git commit -m "Your descriptive note"`.
* **Deploy/Update:** `git push origin main`.
* **Version Control:** Ensure you update the internal version number in your project files before major feature pushes.

### Desktop App (Electron Hub)
* **`npm start`** – Launches the Electron hub locally in developer mode for testing and UI iteration.
* **`npm run dist`** – Compiles the local code into a standalone, single-file Windows executable located in the `dist/` folder (`C3DW Hub 1.0.0.exe`).

---

## 🚀 Setup Checklist
1. **Database:** Create a Supabase project and set up the `colors`, `site_traffic`, and `requests` tables with RLS enabled.
2. **Configuration:** Copy your **Project URL** and **Anon Key** into your local configuration file.
3. **Security:** Add your configuration files to `.gitignore` to prevent API keys from being tracked in version control.
4. **Desktop Build:** Run `npm install` to restore Electron dependencies, then use `npm start` to test or `npm run dist` to compile the production executable.
5. **Legacy Note:** Files such as `inventory.csv` and `json-to-csv.js` are archived and not required for the Supabase-live version.
