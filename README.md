# 🧬 Curalink — AI-Powered Medical Research Assistant

> A full-stack, multilingual medical AI assistant built with the MERN stack, featuring real-time research synthesis from PubMed, OpenAlex, and ClinicalTrials.gov.

---

## ✨ Features

- 🔬 **Medical Research Synthesis** — Queries PubMed, OpenAlex & ClinicalTrials.gov simultaneously
- 🧠 **AI-Powered Insights** — Structured, source-backed responses via LLM
- 🌐 **Multilingual Support** — All 22 official Indian languages with voice I/O
- 🎙️ **Voice Assistant** — Speech-to-Text & Text-to-Speech (ElevenLabs integration)
- 📊 **Health Widgets** — BMI calculator, health news, weather widget & more
- 💬 **Multi-turn Conversations** — Persistent chat with MongoDB
- 🎨 **iOS-inspired Glassmorphism UI** — Dark mode, smooth animations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), CSS Glassmorphism |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| AI/LLM | OpenRouter API |
| Voice | ElevenLabs TTS + Web Speech API |
| APIs | PubMed, OpenAlex, ClinicalTrials.gov |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- API keys: OpenRouter, ElevenLabs

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/curalink.git
cd curalink

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_uri
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
PORT=5000
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Run Locally

```bash
# Start both servers (Windows)
start.bat

# Or manually:
cd backend && npm start
cd frontend && npm run dev
```

---

## 📁 Project Structure

```
curalink/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic & API integrations
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Landing & Chat pages
│   │   ├── hooks/       # Custom React hooks (voice, ElevenLabs)
│   │   └── services/    # API client
│   └── index.html
└── start.bat            # Windows dev launcher
```

---

## 📄 License

MIT © Curalink
