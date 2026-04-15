import axios from 'axios';

async function test() {
  try {
    const res = await axios.post("http://localhost:3000/api/analyze", {
      githubUrl: "https://github.com/Sami001-OG/Winning-AI",
      readmeContent: "# Winning-AI",
      repoDescription: "No description provided."
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

test();
