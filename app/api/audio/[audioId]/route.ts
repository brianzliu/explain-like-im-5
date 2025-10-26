import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type Params = { params: { audioId: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { audioId } = params;
  const clip = await prisma.audioClip.findUnique({ where: { id: audioId } });
  if (!clip) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return new NextResponse(Buffer.from(clip.data), {
    headers: { 'Content-Type': clip.mimeType, 'Content-Length': String(clip.data.length) },
  });
}


