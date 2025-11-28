import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION_CODING = `
You are an expert technical tutor specializing in Web Development, Python, and .NET.
Your goal is to provide comprehensive, easy-to-understand, and professional lecture notes.
Format the response in clean Markdown.
Include code snippets where relevant.
Use bolding for key terms.
Structure with Introduction, Core Concepts, Examples, and Conclusion.
`;

const SYSTEM_INSTRUCTION_THEORY = `
You are an expert academic professor specializing in Artificial Intelligence and Industrial Management.
Your goal is to provide comprehensive, easy-to-understand, and professional lecture notes.
Format the response in clean Markdown.
Focus on concepts, definitions, history, algorithms, and case studies.
DO NOT generate code snippets unless explicitly asked for algorithms (like DFS/BFS pseudocode).
Use bolding for key terms.
Structure with Introduction, Core Concepts, Real-world Applications, and Conclusion.
`;

export async function POST(request: Request) {
  try {
    const { topicTitle, chapterTitle, subjectId } = await request.json();

    const isTheorySubject = subjectId === "ai" || subjectId === "management";
    const systemInstruction = isTheorySubject
      ? SYSTEM_INSTRUCTION_THEORY
      : SYSTEM_INSTRUCTION_CODING;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write detailed lecture notes for the topic: "${topicTitle}" which is part of the chapter "${chapterTitle}".`,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const content = response.text || "Failed to generate content. Please try again.";
    return Response.json({ content });
  } catch (error) {
    console.error("Backend AI Error:", error);
    return Response.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
