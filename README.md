# 🏺 Crafted 3D Printing – Filament Inventory Ecosystem
> A full-stack inventory management and gallery solution for 3D printing, featuring a public interface, a hidden administrative portal, and secure Supabase integration.

---

## 📂 System Architecture
Understanding the purpose and flow of the project:

### 1. Public Facing (Web)
* **`index.html`** – Home and brand introduction page.
* **`inventory.html`** – Real-time filament stock display with dynamic data fetching.
* **`gallery.html`** – High-resolution showcase of completed printed objects.

### 2. Administrative Layer (Hidden)
* **`admin.html`** – A secure, unlinked portal for inventory management.
  * *Purpose:* Allows adding, editing, or deleting filament records from a mobile-friendly interface.
  * *Connectivity:* Synchronized with the mobile app for on-the-go updates.

### 3. Data & Logic
* **`/js/supabase-config.js`** – Centralized initialization for the Supabase client.
* **`/js/inventory.js`** – Handles public data fetching, rendering, and filtering.
* **`/js/admin.js`** – Manages administrative database operations (POST/PATCH/DELETE).

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

---

## 🛠 Maintenance & CLI Workflow
Use these standard Git commands to keep your development environment accurate and up-to-date:

* **Check Status:** `git status` (See pending changes).
* **Save Progress:** `git add .` followed by `git commit -m "Your descriptive note"`.
* **Deploy/Update:** `git push origin main`.
* **Version Control:** Ensure you update the internal version number in your project files before major feature pushes.

---

## 🚀 Setup Checklist
1. **Database:** Create a Supabase project and set up the `colors` and `site_traffic` tables with RLS enabled.
2. **Configuration:** Copy your **Project URL** and **Anon Key** into your local configuration file.
3. **Security:** Add your configuration files to `.gitignore` to prevent API keys from being tracked in version control.
4. **Legacy Note:** Files such as `inventory.csv` and `json-to-csv.js` are archived and not required for the Supabase-live version.