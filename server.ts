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
    const { githubUrl, readmeContent, repoDescription } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    try {
      // 1. Call OpenRouter API
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        return res.status(500).json({ error: "OpenRouter API key not configured" });
      }

      const prompt = `
        Analyze the following GitHub repository: ${githubUrl}
        
        Repository Description:
        ${repoDescription || "No description provided."}
        
        README Content:
        ${(readmeContent || "").substring(0, 8000)} // Limit to 8000 chars for safety
        
        Please provide a highly comprehensive analysis in JSON format. You MUST use EXACTLY these keys:
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
        
        Ensure the output is ONLY a valid JSON object. Do not include any conversational text, markdown formatting, or code blocks.
        IMPORTANT: Use double quotes for all keys and string values. Ensure all strings are properly escaped. Do not use unescaped quotes or literal newlines inside strings. Use \\n for newlines.
        CRITICAL: You must include ALL 6 keys ("overview", "buildGuide", "equipment", "roadmap", "techStack", "difficulty") exactly as written.
      `;

      const openRouterRes = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
          temperature: 0.2, // Lower temperature for more consistent JSON
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

      if (!openRouterRes.data || !openRouterRes.data.choices || openRouterRes.data.choices.length === 0) {
        console.error("OpenRouter API returned unexpected response:", JSON.stringify(openRouterRes.data));
        return res.status(500).json({ error: "The AI service returned an unexpected response. Please try again." });
      }

      let content = openRouterRes.data.choices[0].message?.content;
      
      if (!content) {
        console.error("OpenRouter API returned empty content:", JSON.stringify(openRouterRes.data));
        return res.status(500).json({ error: "The AI service returned an empty response. Please try again." });
      }
      
      // Extract the JSON object from the response to ignore any conversational text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      } else {
        // Fallback to stripping markdown
        content = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      }
      
      try {
        const repairedContent = jsonrepair(content);
        let analysis = JSON.parse(repairedContent);
        
        // Normalize keys in case the AI capitalized them or nested them
        if (analysis.analysis) analysis = analysis.analysis;
        if (analysis.Analysis) analysis = analysis.Analysis;
        
        const normalizedAnalysis = {
          overview: analysis.overview || analysis.Overview || analysis.ProjectOverview || analysis["Project Overview"] || "No overview provided.",
          buildGuide: analysis.buildGuide || analysis.BuildGuide || analysis.build_guide || analysis["Build Guide"] || "No build guide provided.",
          equipment: analysis.equipment || analysis.Equipment || analysis.hardware || analysis.Hardware || [],
          roadmap: analysis.roadmap || analysis.Roadmap || analysis.deploymentRoadmap || analysis["Deployment Roadmap"] || [],
          techStack: analysis.techStack || analysis.TechStack || analysis.tech_stack || analysis["Tech Stack"] || [],
          difficulty: analysis.difficulty || analysis.Difficulty || "Unknown"
        };
        
        res.json(normalizedAnalysis);
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
