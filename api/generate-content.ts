export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { topicTitle, chapterTitle, subjectId } = await request.json();
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Write detailed lecture notes for the topic "${topicTitle}" which is part of the chapter "${chapterTitle}".`
          }]
        }]
      }),
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated';

    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
