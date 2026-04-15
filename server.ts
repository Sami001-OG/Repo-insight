import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { jsonrepair } from "jsonrepair";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route for analysis
  app.post("/api/analyze", async (req, res) => {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    try {
      // 1. Parse GitHub URL to get owner and repo
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub URL" });
      }

      const [_, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");

      // 2. Fetch repository details and README
      let readmeContent = "";
      try {
        // First check if repo exists and get basic info
        const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}`);
        const repoDescription = repoRes.data.description || "No description provided.";

        // Then try to get the README
        try {
          const readmeRes = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
            headers: {
              Accept: "application/vnd.github.raw",
            },
          });
          readmeContent = readmeRes.data;
        } catch (readmeErr: any) {
          if (readmeErr.response?.status === 404) {
            // It's normal for some repos to not have a README
            readmeContent = `No README found. Repository description: ${repoDescription}`;
          } else {
            console.warn(`Warning: Could not fetch README for ${owner}/${cleanRepo}:`, readmeErr.message);
            readmeContent = `Could not fetch README. Repository description: ${repoDescription}`;
          }
        }
      } catch (repoErr: any) {
        if (repoErr.response?.status === 404) {
          return res.status(404).json({ error: "Repository not found. Maybe the repository is private or the URL is incorrect." });
        } else if (repoErr.response?.status === 403 || repoErr.response?.status === 429) {
          return res.status(429).json({ error: "GitHub API rate limit exceeded. Please try again later." });
        }
        console.error("Error fetching from GitHub:", repoErr.message);
        return res.status(500).json({ error: "Failed to communicate with GitHub API." });
      }

      // 3. Call OpenRouter API
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        return res.status(500).json({ error: "OpenRouter API key not configured" });
      }

      const prompt = `
        Analyze the following GitHub repository: ${githubUrl}
        
        README Content:
        ${readmeContent.substring(0, 8000)} // Limit to 8000 chars for safety
        
        Please provide a highly comprehensive analysis in JSON format with the following structure:
        {
          "overview": "A detailed summary of what the project is, its purpose, and its core features.",
          "buildGuide": "A highly detailed, step-by-step execution guide on how a user can implement, build, and run this entire project from scratch on their own. Include terminal commands and configuration steps.",
          "equipment": ["Detailed list of specific hardware, software, dependencies, and tools needed to implement this project."],
          "roadmap": [
            { "phase": "Phase Name", "tasks": ["Task 1", "Task 2"] }
          ],
          "techStack": ["List of technologies, frameworks, and languages used"],
          "difficulty": "Beginner/Intermediate/Advanced"
        }
        
        Ensure the output is ONLY the JSON object. Do not include any conversational text.
        IMPORTANT: Ensure all strings are properly escaped. Do not use unescaped quotes or literal newlines inside strings. Use \\n for newlines.
      `;

      const openRouterRes = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://repoinsight.app", // Optional
            "X-Title": "RepoInsight", // Optional
          },
        }
      );

      let content = openRouterRes.data.choices[0].message.content;
      // Strip markdown code blocks if the model wrapped the JSON
      content = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      
      try {
        const repairedContent = jsonrepair(content);
        const analysis = JSON.parse(repairedContent);
        res.json(analysis);
      } catch (parseError: any) {
        console.error("JSON Parsing Error:", parseError.message);
        console.error("Raw Content:", content);
        res.status(500).json({ error: "The system generated invalid or incomplete data. Please try again." });
      }

    } catch (error: any) {
      console.error("Analysis error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to analyze repository. Check your API key and URL." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
