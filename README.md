# 🚀 Tech Games Fest 2026 — Official Web Portal

> **Organized by `<code >sanket;` — Department of CSE (AI & DS)**  
> **School of Engineering (SOE) • Dayananda Sagar University (DSU), Bengaluru**  
> **Dates:** 16th – 17th November 2026 | **Timings:** 8:45 AM – 4:00 PM | **Venue:** SOE: BLOCK A, LH:2  
> **Support Email:** `codesanket-ai.ds@dsu.edu.in`

---

## 🌟 Key Features

1. **Computer Science Dark Aesthetics**:
   - High-performance, pitch-black CS terminal aesthetic (`#030407`) with custom terminal chrome (`● ● ● >_`).
   - 7 signature neon color palettes across all competition arenas:
     - 🟢 **Arena #1 (Quiz)**: Neon Emerald (`#00FF9D`)
     - 🟠 **Arena #2 (Collage)**: Amber Gold (`#F59E0B`)
     - 🔵 **Arena #3 (Pitch Perfect)**: Electric Cyan (`#00E5FF`)
     - 🟣 **Arena #4 (Charades)**: Cyber Purple (`#A855F7`)
     - 🔴 **Arena #5 (Debate)**: Radical Rose (`#FF3366`)
     - 🟡 **Arena #6 (Artistry)**: Teal Stream (`#14B8A6`)
     - 🟣 **Arena #7 (Pictionary)**: Quantum Indigo (`#818CF8`)

2. **Full Responsive Design**:
   - Optimized for mobile phones (including iPhone and Android screens), tablets, and widescreen desktop displays.
   - Touch-friendly action buttons and iOS Safari anti-zoom protection.

3. **Cashfree Payments Gateway Integration**:
   - Secure server-side order creation using official `cashfree-pg` SDK.
   - Cryptographic HMAC-SHA256 signature verification on `/api/webhook/cashfree`.
   - Real-time status sync: automatically marks orders `PAID`, stores 12-digit UTR, and unlocks access.
   - Self-verification fallback modal for delayed bank notifications.

4. **Dynamic Refreshment Pricing**:
   - Server-enforced pricing matrix prevents client-side tampering:
     - Base Fest Participation: **₹0.00**
     - Snack Pack 1 (Juice + Chips / Biscuit + Ice Cream): **₹135.00 / member**
     - Snack Pack 2 (Diet Coke + Chips / Ice Cream + Diet Coke): **₹240.00 / member**

5. **Compliant Legal Framework**:
   - Standalone `/terms.html` and `/refund.html` policy pages.
   - Organizer command center with real-time analytics, participant lookup, and CSV export.

---

## 🛠️ Deploying to Render (Single Web Service)

This application uses Node.js and Express to serve both backend APIs and the frontend static assets. You only need **one Web Service** on Render!

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: complete Tech Games Fest 2026 web application ready for production"
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub account and select repository: **`Jashwanth-0624/TechGamesFest`**.
3. Configure the settings:
   - **Name:** `techgamesfest` (or your preferred name)
   - **Region:** `Singapore` (closest to India) or `Frankfurt`
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables
Under the **Environment Variables** tab in your Render service settings, add:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Recommended for Node apps |
| `CASHFREE_APP_ID` | *Your Cashfree App ID* | Found in Cashfree Merchant Dashboard |
| `CASHFREE_SECRET_KEY` | *Your Cashfree Secret Key* | Found in Cashfree Merchant Dashboard |
| `CASHFREE_ENV` | `PRODUCTION` *(or `SANDBOX` for testing)* | Environment mode |

*(Note: Render automatically injects `PORT` and `RENDER_EXTERNAL_URL`, which `server.js` auto-detects.)*

### Step 4: Configure Webhook in Cashfree Dashboard
Once deployed on Render, your public URL will look like:
`https://techgamesfest.onrender.com`

Go to your **Cashfree Merchant Dashboard** → **Developers** → **Webhooks** and register:
- **Webhook URL:** `https://your-service-name.onrender.com/api/webhook/cashfree`
- **Events:** `ORDER_PAID`, `PAYMENT_SUCCESS_WEBHOOK`

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
cp .env.example .env

# 3. Start development server
npm start
```
Visit `http://localhost:3000` in your browser.
