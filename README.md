# 🌿 IngredientIQ

**Personalized food safety scanner.** Scan any product's ingredient list and get an instant AI-powered safety report tailored to your health conditions, allergies, and dietary restrictions.

> Not a generic "is this healthy" app — it tells *you specifically* whether *this* product is safe for *your* conditions.

![Verdict: Caution](https://img.shields.io/badge/verdict-caution-orange) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 📸 **Camera scan** — point your phone at any ingredient label
- 📋 **Text paste** — copy from any website or food app
- 🤖 **AI-powered analysis** — Gemini 1.5 Flash cross-references ingredients against your profile
- 🏥 **Personalized results** — flagged ingredients come with a reason specific to *your* condition
- 🔒 **100% private** — health profile stored only on your device, never uploaded
- 📱 **Mobile-first** — designed for one-handed phone use
- 🕐 **Scan history** — revisit past scans

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A free [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ingredientiq.git
cd ingredientiq
npm run install:all
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_key_here
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Run the app

From the root folder:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone or desktop.

---

## 🌐 Deployment

### Backend → Railway (free tier)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `server` folder (or set root directory to `server`)
3. Add environment variables in Railway dashboard:
   - `GEMINI_API_KEY` = your key
   - `ALLOWED_ORIGINS` = https://your-app.vercel.app
4. Railway gives you a URL like `https://ingredientiq-server.railway.app`

### Frontend → Vercel (free tier)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **root directory** to `client`
3. Add environment variable:
   - `VITE_API_URL` = https://your-backend.railway.app/api
4. Deploy — Vercel gives you a public URL

---

## 🏗️ Project Structure

```
ingredientiq/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Landing page
│   │   │   ├── Profile.jsx  # Health profile setup
│   │   │   ├── Scan.jsx     # Camera + OCR + paste
│   │   │   ├── Result.jsx   # Analysis result
│   │   │   └── History.jsx  # Scan history
│   │   ├── hooks/
│   │   │   ├── useProfile.js  # localStorage profile
│   │   │   ├── useHistory.js  # localStorage history
│   │   │   └── useOCR.js      # Tesseract.js OCR
│   │   ├── utils/
│   │   │   └── api.js         # Backend API calls
│   │   └── components/
│   │       └── Layout.jsx     # Bottom nav shell
│   └── vercel.json
│
└── server/                  # Express backend
    ├── src/
    │   ├── index.js           # Server entry (CORS, rate limiting)
    │   └── routes/
    │       └── analyze.js     # Gemini API integration
    └── railway.json
```

---

## 🤖 How the AI Analysis Works

The backend sends a carefully structured prompt to Gemini 1.5 Flash:

```
USER HEALTH PROFILE:
Medical conditions: Celiac Disease, IBD
Allergies: Peanuts, Milk

INGREDIENT LIST:
Water, Modified Wheat Starch, Sugar, Carrageenan...

→ Returns: { verdict, summary, flagged: [{ingredient, reason, severity}] }
```

The key design choice: the AI is given **only the user's specific conditions** and told to flag ingredients **specifically relevant to them** — not general health scores.

---

## 🤝 Contributing

Contributions welcome! Ideas for improvement:

- [ ] Barcode scanning via Open Food Facts API
- [ ] More condition presets
- [ ] PWA / installable on home screen
- [ ] Export scan results as PDF
- [ ] Multi-language support

---

## 📄 License

MIT — free to use, fork, and build on.

---

*Built with React, Tesseract.js, Express, and Gemini API.*
