// src/services/geminiService.ts

// LESSONS
export const generateTopicContent = async (
  topicTitle: string,
  chapterTitle: string,
  subjectId: string
): Promise<string> => {
  try {
    const res = await fetch('/api/generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicTitle, chapterTitle, subjectId }),
    });
    const data = await res.json();
    if (!res.ok) return `Error from backend: ${data.error || 'Unknown error'}`;
    return data.content || 'Failed to generate content. Please try again.';
  } catch (e) {
    return `Error calling backend: ${(e as Error).message}`;
  }
};

export const generateTopicContentById = async (
  topicId: string,
  topicTitle: string,
  chapterTitle: string,
  subjectId: string
): Promise<string> => {
  return generateTopicContent(topicTitle, chapterTitle, subjectId);
};

// SUMMARY
export const generateSummaryForTopic = async (
  topicTitle: string,
  chapterTitle: string
): Promise<string> => {
  try {
    const res = await fetch('/api/generateSummary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicTitle, chapterTitle }),
    });
    const data = await res.json();
    if (!res.ok) return `Error from backend: ${data.error || 'Unknown error'}`;
    return data.content || 'Failed to generate summary.';
  } catch (e) {
    return `Error calling backend: ${(e as Error).message}`;
  }
};

// QUIZ
export const generateQuizForTopic = async (topicTitle: string): Promise<string> => {
  try {
    const res = await fetch('/api/generateQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicTitle }),
    });
    const data = await res.json();
    if (!res.ok) return `Error from backend: ${data.error || 'Unknown error'}`;
    return data.content || 'Failed to generate quiz.';
  } catch (e) {
    return `Error calling backend: ${(e as Error).message}`;
  }
};

// TTS
export const generateSpeechForText = async (
  text: string,
  voiceName: string = 'Kore'
): Promise<string | null> => {
  try {
    const res = await fetch('/api/generateSpeech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data.audio || null;
  } catch {
    return null;
  }
};
