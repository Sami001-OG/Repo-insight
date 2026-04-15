import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const prompt = `
    Analyze the following GitHub repository: https://github.com/Sami001-OG/Winning-AI
    
    Repository Description:
    No description provided.
    
    README Content:
    # Winning-AI
    
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
    
    Ensure the output is ONLY a valid JSON object. Do not include any conversational text, markdown formatting, or code blocks.
    IMPORTANT: Use double quotes for all keys and string values. Ensure all strings are properly escaped. Do not use unescaped quotes or literal newlines inside strings. Use \\n for newlines.
  `;

  try {
    const openRouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("RAW CONTENT:");
    console.log(openRouterRes.data.choices[0].message.content);
  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
}

test();
