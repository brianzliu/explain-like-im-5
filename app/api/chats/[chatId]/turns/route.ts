import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

type Params = { params: { chatId: string } };

// GET /api/chats/[chatId]/turns - list turns for a chat
export async function GET(_req: NextRequest, { params }: Params) {
  const { chatId } = params;
  const turns = await prisma.turn.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, question: true, answer: true, concept: true, summary: true, audioId: true, createdAt: true },
  });
  return NextResponse.json({ turns });
}

// POST /api/chats/[chatId]/turns - add a turn; optional audio base64
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { chatId } = params;
    const body = await req.json();
    const { question, answer, concept, summary, audioBase64, mimeType } = body as {
      question: string;
      answer: string;
      concept: string;
      summary: string;
      audioBase64?: string;
      mimeType?: string;
    };

    if (!question || !answer || !concept || !summary) {
      return NextResponse.json({ error: 'question, answer, concept, and summary are required' }, { status: 400 });
    }

    let audioId: string | null = null;
    if (audioBase64) {
      const data = Buffer.from(audioBase64, 'base64');
      const clip = await prisma.audioClip.create({ data: { data, mimeType: mimeType || 'audio/mpeg' } });
      audioId = clip.id;
    }

    const turn = await prisma.turn.create({
      data: { chatId, question, answer, concept, summary, audioId: audioId || undefined },
      select: { id: true, audioId: true },
    });

    return NextResponse.json({ turnId: turn.id, audioId: turn.audioId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'failed to add turn' }, { status: 500 });
  }
}


