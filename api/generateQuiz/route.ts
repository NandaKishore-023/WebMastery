import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { topicTitle } = await request.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a 3-question multiple choice quiz for the topic "${topicTitle}". 

STRICT FORMAT RULES:
1. Separate each question with a horizontal rule "---".
2. The Question text must start with "**Q".
3. Options must be a list starting with "- A.", "- B.", etc.
4. The answer must be in a hidden details block at the end of the question block.
5. The answer text inside the block MUST follow the pattern "Correct Answer: [Letter]".

Example:
**Q1. Question text here?**
- A. Option One
- B. Option Two
<details><summary>View Answer</summary>Correct Answer: B</details>
---
**Q2. Next Question?**
...`,
      config: {
        temperature: 0.5,
      },
    });

    const content = response.text || "Failed to generate quiz.";
    return Response.json({ content });
  } catch (error) {
    console.error("Backend Quiz Error:", error);
    return Response.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
