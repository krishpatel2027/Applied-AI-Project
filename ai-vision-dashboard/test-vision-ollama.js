const fs = require("fs");

async function testExtraction() {
  const modelName = "llama3.2-vision:latest";
  
  // The user might have renamed the file, we will use test_screenshot.png if test-lecture.jpg is missing
  let imagePath = "./test_data/test-lecture.jpg";
  if (!fs.existsSync(imagePath)) {
    if (fs.existsSync("./test_screenshot.png")) {
      imagePath = "./test_screenshot.png";
    }
  }

  // Convert image to base64
  let imageData;
  try {
    imageData = fs.readFileSync(imagePath).toString("base64");
  } catch (error) {
    console.error(`Error reading image at ${imagePath}:`, error.message);
    return;
  }

  const prompt = `
    Analyze this lecture image. 
    1. Extract all text content.
    2. Identify and transcribe any mathematical formulas.
    3. If there are diagrams, describe them in detail so a search engine could find them.
    4. Format the entire output in clean Markdown using ## for main topics and ### for sub-topics.
  `;

  console.log(`🚀 AI (${modelName}) is analyzing your lecture...`);
  
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        images: [imageData],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    console.log("\n--- EXTRACTED CONTENT ---\n");
    console.log(result.response);
  } catch (error) {
    console.error("Failed to connect to Ollama. Make sure Ollama is running locally (http://localhost:11434) and the model is pulled.");
    console.error(error.message);
  }
}

testExtraction();
