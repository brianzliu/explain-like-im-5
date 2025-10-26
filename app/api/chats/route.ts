import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/chats - list chats
export async function GET() {
  const chats = await prisma.chat.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, teacher: true, title: true, createdAt: true },
  });
  return NextResponse.json({ chats });
}

// POST /api/chats - create a new chat
export async function POST(req: NextRequest) {
  try {
    const { teacher, title } = await req.json();
    if (!teacher) {
      return NextResponse.json({ error: 'teacher is required' }, { status: 400 });
    }
    const chat = await prisma.chat.create({ data: { teacher, title } });
    return NextResponse.json({ chatId: chat.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'failed to create chat' }, { status: 500 });
  }
}


