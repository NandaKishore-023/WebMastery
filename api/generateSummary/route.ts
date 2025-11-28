import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { topicTitle, chapterTitle } = await request.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a concise summary (max 300 words) for the topic "${topicTitle}" from chapter "${chapterTitle}". Use bullet points for key takeaways.`,
      config: {
        temperature: 0.4,
      },
    });

    const content = response.text || "Failed to generate summary.";
    return Response.json({ content });
  } catch (error) {
    console.error("Backend Summary Error:", error);
    return Response.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
