'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import clsx from 'clsx';

type AvatarCardProps = { teacher: 'spongebob' | 'peter' | 'edna' };

const teacherMeta: Record<AvatarCardProps['teacher'], { name: string; img: string; bg: string }> = {
  spongebob: { name: 'spongebob', img: '/images/spongebob.png', bg: 'bg-yellow-100' },
  peter: { name: 'peter griffin', img: '/images/peter.png', bg: 'bg-pink-100' },
  edna: { name: 'edna mode', img: '/images/edna.png', bg: 'bg-purple-100' }
};

export function AvatarCard({ teacher }: AvatarCardProps) {
  const meta = teacherMeta[teacher];
  const href = useMemo(() => `/teachers/${teacher}`, [teacher]);
  return (
    <Link href={href} className="group block">
      <div className={clsx('card p-6 flex flex-col items-center gap-4 transition transform group-hover:-translate-y-1', meta.bg)}>
        <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-md">
          <Image src={meta.img} alt={meta.name} fill className="object-cover" />
        </div>
        <div className="text-xl font-semibold capitalize">{meta.name}</div>
      </div>
    </Link>
  );
}

