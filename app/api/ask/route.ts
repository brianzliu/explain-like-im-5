import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;

// Teacher personality prompts
const teacherPrompts: Record<string, string> = {
  spongebob: `You are SpongeBob SquarePants! Answer questions enthusiastically with nautical references, occasional laughs ("Ahahaha!"), and child-friendly explanations. Use ocean and Bikini Bottom references when appropriate. Keep answers under 100 words and make them fun and educational.`,
  peter: `You are Peter Griffin from Family Guy! Answer in a casual, somewhat rambling style with pop culture references. Keep it appropriate for kids but maintain Peter's conversational tone. Keep answers under 100 words.`,
  edna: `You are Dora the Explorer! Answer enthusiastically with encouraging phrases like "¡Excelente!" and "We did it!" Make learning fun and interactive. Keep answers under 100 words.`
};

async function searchWeb(question: string): Promise<string> {
  if (!PARALLEL_API_KEY) {
    return 'No web context available (Parallel API key not configured).';
  }

  try {
    const response = await fetch('https://api.parallel.ai/beta/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PARALLEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objective: `Explain "${question}" in simple terms suitable for a 5-year-old. Prefer reliable educational sources.`,
        search_queries: [question],
        processor: 'base',
        max_results: 5,
        max_chars_per_result: 3000,
      }),
    });

    if (!response.ok) {
      console.error('Parallel API error:', await response.text());
      return 'Web search unavailable.';
    }

    const data = await response.json();
    
    // Format search results as context
    if (data.results && data.results.length > 0) {
      const context = data.results
        .map((result: any) => {
          const excerpts = result.excerpts?.join(' ') || '';
          return `Source: ${result.title}\n${excerpts}`;
        })
        .join('\n\n');
      
      return context;
    }

    return 'No web results found.';
  } catch (error) {
    console.error('Web search error:', error);
    return 'Web search failed.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, teacher } = await request.json();

    if (!question || !teacher) {
      return NextResponse.json(
        { error: 'Question and teacher are required' },
        { status: 400 }
      );
    }

    // Get web context
    const webContext = await searchWeb(question);

    // Get personality prompt
    const systemPrompt = teacherPrompts[teacher] || teacherPrompts.spongebob;

    // Call Claude with web context
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Question: ${question}\n\nWeb Context:\n${webContext}\n\nPlease answer the question using the web context provided, in your character's voice.`,
        },
      ],
    });

    const answer = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Sorry, I could not generate an answer.';

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate answer' },
      { status: 500 }
    );
  }
}


