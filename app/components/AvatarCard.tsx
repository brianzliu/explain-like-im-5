'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import clsx from 'clsx';

type AvatarCardProps = { teacher: 'spongebob' | 'peter' | 'dora' };

const teacherMeta: Record<AvatarCardProps['teacher'], { name: string; img: string; accent: string; dot: string }> = {
  spongebob: { name: 'spongebob', img: '/images/spongebob_neutral.png', accent: 'from-[#FFF7AE] via-[#FFF3C4] to-white', dot: 'bg-[#FFE66D]' },
  peter: { name: 'peter griffin', img: '/images/peter_neutral.png', accent: 'from-[#FFD7E0] via-[#FFE4ED] to-white', dot: 'bg-[#FF9EC7]' },
  dora: { name: 'dora the explorer', img: '/images/dora_neutral.png', accent: 'from-[#E9D7FF] via-[#F4E9FF] to-white', dot: 'bg-[#C084FC]' }
};

export function AvatarCard({ teacher }: AvatarCardProps) {
  const meta = teacherMeta[teacher];
  const href = useMemo(() => `/teachers/${teacher}`, [teacher]);
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-black/10 bg-white shadow-[0_16px_0_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_24px_0_rgba(0,0,0,0.12)]">
        <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100', meta.accent)} />
        <div className="relative flex flex-col items-center gap-5 px-8 py-10">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Your guide</span>
          <div className="relative h-32 w-32 rounded-[1.5rem] border-4 border-black/5 bg-white">
            <Image src={meta.img} alt={meta.name} fill className="object-contain" />
          </div>
          <div className="text-2xl font-black capitalize tracking-tight text-slate-900">{meta.name}</div>
          <p className="text-center text-sm font-medium text-slate-500">Tap to learn with {meta.name}</p>
        </div>
      </div>
    </Link>
  );
}

