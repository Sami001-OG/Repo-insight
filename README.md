# RepoInsight 🔍

**Live Demo:** [https://repo-insight.onrender.com/](https://repo-insight.onrender.com/)

RepoInsight is an intelligent developer tool that instantly analyzes any public GitHub repository and generates a comprehensive architectural blueprint. Powered by advanced LLMs via OpenRouter, it turns complex codebases into easy-to-understand guides.

## 🚀 Features

- **Project Overview:** Get a clear summary of the project's purpose, core features, and difficulty level.
- **Build & Initiation Guide:** Highly detailed, step-by-step execution guides including terminal commands to run the project locally from scratch.
- **Hardware & Infrastructure:** A breakdown of the specific tools, dependencies, and environments needed.
- **Deployment Roadmap:** A phased timeline of tasks required to build, iterate, and deploy the project.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Node.js, Express, TypeScript
- **AI Integration:** OpenRouter API (Nemotron-3 Super)
- **Deployment:** Render

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## ☁️ Deployment

This project is configured for 1-click deployment on [Render](https://render.com/) using the included `render.yaml` blueprint. Simply connect your GitHub repository to Render as a Blueprint instance and provide your `OPENROUTER_API_KEY`.
