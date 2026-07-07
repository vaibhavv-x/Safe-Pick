# 🛡️ SafePick

AI-Powered Smart Decision & Safety Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/TypeScript-Enabled-blue?style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/badge/Firebase-Backend-orange?style=for-the-badge&logo=firebase"/>
  <img src="https://img.shields.io/badge/AI-Genkit-purple?style=for-the-badge"/>
</p>

# 🌐 Live Deployment

- **Live App:** https://safe-pick-sand.vercel.app/

# 🚀 Overview

SafePick is a full-stack AI-powered platform that helps users make safer, smarter decisions using real-time data, intelligent insights, and a modern web interface.

Built with a scalable architecture, SafePick combines AI, data processing, and intuitive UI to deliver fast and reliable results.


# ✨ Key Features
	•	🧠 AI Decision Engine – Smart recommendations powered by GenAI
	•	📷 QR-Based Interaction – Scan & process data instantly
	•	📊 Data Visualization – Clean charts and analytics
	•	🔐 Secure Backend – Firebase-powered authentication & storage
	•	⚡ Blazing Fast UI – Built with Next.js + Tailwind
	•	🧩 Modular Architecture – Clean, scalable codebase


# 🏗️ Project Structure

```bash
SafePick/
│
├── src/                        # Frontend (Next.js App Router)
│   ├── app/                    # Pages & routing
│   ├── components/             # UI components
│   ├── ai/                     # AI logic (Genkit)
│   └── lib/                    # Utilities & helpers
│
├── backend/                    # Backend services
│   ├── db/                     # Database configs
│   ├── scripts/                # Utility scripts
│   ├── src/                    # Backend source code
│   ├── migrate.ts              # DB migration
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── docs/                       # Documentation
├── public/                     # Static assets
│
├── make_ingest.mjs             # Data ingestion script
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind setup
├── postcss.config.mjs          # PostCSS config
├── tsconfig.json               # TypeScript config
├── components.json             # UI config
├── apphosting.yaml             # Deployment config
│
├── package.json
├── package-lock.json
├── README.md
│
├── digest.txt                  # Logs / debug
├── errors.txt                  # Error logs
├── ts_errors.txt               # TypeScript errors
```

# 🛠️ Tech Stack

### 🎨 Frontend
	•	Next.js 15
	•	React 19
	•	Tailwind CSS
	•	Radix UI

### ⚙️ Backend
	•	Node.js + TypeScript
	•	Firebase
	•	Custom scripts & ingestion pipeline

### 🤖 AI Integration
	•	Google Genkit
	•	AI-powered decision logic

# ⚙️ Getting Started

### 1️⃣ Clone Repository
git clone https://github.com/your-username/safepick.git
cd safepick

### 2️⃣ Install Dependencies
npm install
cd backend && npm install

### 3️⃣ Setup Environment Variables
Create .env file in root:
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
GENKIT_API_KEY=your_ai_key

### 4️⃣ Run Frontend
npm run dev

### 5️⃣ Run Backend
cd backend
npm run dev

### 6️⃣ Run AI (Genkit)
npm run genkit:dev

# 📊 Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run frontend |
| `npm run build` | Build app |
| `npm start` | Production |
| `npm run genkit:dev` | Run AI |
| `npm run lint` | Lint code |

# 🚀 Future Scope
	•	📱 Mobile App Integration
	•	🧠 Advanced AI Predictions
	•	🌍 Multi-language Support
	•	🔐 Role-Based Access Control

# 🤝 Contributing
	1.	Fork the repository
	2.	Create a feature branch
	3.	Commit changes
	4.	Open Pull Request

# 📄 License

MIT License


# 👨‍💻 Author

Vaibhav
Full Stack Developer (MERN)


# ⭐ Show Your Support

If you like this project, drop a ⭐ on GitHub!
