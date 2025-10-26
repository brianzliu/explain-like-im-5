import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;

// Teacher personality prompts
const teacherPrompts: Record<string, string> = {
  spongebob: `You are SpongeBob SquarePants explaining things! Keep answers under 50 words. Focus 90% on educational facts and interesting details. Add just a touch of enthusiasm and one brief ocean reference if relevant.`,
  peter: `You are Peter Griffin explaining things! Keep answers under 50 words. Focus 90% on educational facts and real-world examples. Keep it casual but informative.`,
  dora: `You are Dora the Explorer explaining things! Keep answers under 50 words. Focus 90% on educational content. Add brief encouraging phrases like "Great question!" sparingly.`
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
    const { question, teacher, conversationHistory = [] } = await request.json();

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

    // Build context messages with conversation history
    const messages: Array<{ role: 'user' | 'assistant', content: string }> = [];
    conversationHistory.forEach((turn: { question: string, answer: string }) => {
      messages.push({ role: 'user', content: turn.question });
      messages.push({ role: 'assistant', content: turn.answer });
    });
    messages.push({
      role: 'user',
      content: `Question: ${question}\n\nWeb Context:\n${webContext}\n\nPlease answer the question using the web context provided, in your character's voice. Keep answers under 50 words.`,
    });

    // Call Claude with streaming (web context from Parallel API + extended thinking via Sonnet)
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: `${systemPrompt}\nAlso, after answering, provide:
1. A concise concept label (2-4 words) in format: <concept: LABEL>
2. A one-sentence summary (10-15 words) in format: <summary: SUMMARY>`,
      messages,
    });

    // Return streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: any) {
    console.error('Ask API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate answer' },
      { status: 500 }
    );
  }
}


