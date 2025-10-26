import Sidebar from '../../components/Sidebar';
import VoicePanel from './voice-panel';

// Generate static params for all teachers
export function generateStaticParams() {
  return [
    { teacher: 'spongebob' },
    { teacher: 'peter' },
    { teacher: 'dora' },
  ];
}

const teacherBackgrounds: Record<'spongebob' | 'peter' | 'dora', string> = {
  spongebob: '/images/bikini_bottom.jpg',
  peter: '/images/familyguy.png',
  dora: '/images/dora.jpeg'
};

export default function TeacherPage({ params, searchParams }: { params: { teacher: 'spongebob' | 'peter' | 'dora' }, searchParams?: Record<string, string | string[] | undefined> }) {
  const teacher = params.teacher;
  const chatId = typeof searchParams?.chatId === 'string' ? searchParams?.chatId : undefined;
  const background = teacherBackgrounds[teacher];
  
  return (
    <main className="flex min-h-dvh bg-[#FFE571] text-slate-900">
      <Sidebar />
      <section className="relative flex-1 overflow-hidden p-0 md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-36 h-[23rem] w-[23rem] rounded-full bg-[#A5D8FF] opacity-60 blur-3xl" />
          <div className="absolute -bottom-36 -right-28 h-[26rem] w-[26rem] rounded-full bg-[#B7F4A8] opacity-60 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 h-32 w-32 rounded-full bg-[#FFE3E2] opacity-70 blur-2xl" />
        </div>
        <div className="relative h-full">
          <div 
            className="flex h-full flex-col overflow-hidden rounded-[3rem] border-4 border-black/10 shadow-[0_25px_0_rgba(0,0,0,0.08)] md:grid md:grid-cols-[minmax(0,1fr)_360px]"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Semi-transparent overlay for better readability */}
            <div className="absolute inset-0 bg-white/70 rounded-[3rem]" />
            
            {/* Content with relative positioning */}
            <div className="relative flex flex-col p-4 md:p-8">
              <VoicePanel teacher={teacher} chatId={chatId} />
            </div>
            <aside className="relative hidden md:flex flex-col gap-4 border-l-4 border-black/5 bg-[#F5FBFF]/80 p-6">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Concept trail</div>
              <div id="concept-sidebar" className="flex-1 overflow-auto" />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

