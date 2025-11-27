import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// --- CONTENT GENERATION (AI) ---

export const generateTopicContent = async (topicTitle: string, chapterTitle: string, subjectId: string): Promise<string> => {
  try {
    const isTheorySubject = subjectId === 'ai' || subjectId === 'management';
    const systemInstruction = isTheorySubject ? SYSTEM_INSTRUCTION_THEORY : SYSTEM_INSTRUCTION_CODING;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write detailed lecture notes for the topic: "${topicTitle}" which is part of the chapter "${chapterTitle}".`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
      },
    });

    return response.text || "Failed to generate content. Please try again.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return `Error generating content: ${(error as Error).message}. Please check your API key or connection.`;
  }
};

// Wrapper to match the Component's expectation (id is unused in API call, we use titles)
export const generateTopicContentById = async (topicId: string, topicTitle: string, chapterTitle: string, subjectId: string = 'web-design'): Promise<string> => {
   return generateTopicContent(topicTitle, chapterTitle, subjectId);
}

export const generateSummaryForTopic = async (topicTitle: string, chapterTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a concise summary (max 300 words) for the topic "${topicTitle}" from chapter "${chapterTitle}". Use bullet points for key takeaways.`,
      config: {
        temperature: 0.4,
      },
    });
    return response.text || "Failed to generate summary.";
  } catch (error) {
    return "Error generating summary.";
  }
};

export const generateQuizForTopic = async (topicTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      ...
      `,
      config: {
        temperature: 0.5,
      },
    });
    return response.text || "Failed to generate quiz.";
  } catch (error) {
    return "Error generating quiz.";
  }
};

// --- AUDIO GENERATION (GEMINI TTS) ---

export const generateSpeechForText = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    // Extract base64 audio data
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    return null;
  }
};