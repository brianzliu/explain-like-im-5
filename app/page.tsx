import Sidebar from './components/Sidebar';
import { AvatarCard } from './components/AvatarCard';

export default function Page() {
  return (
    <main className="min-h-dvh flex bg-[#FFF07F] text-slate-900">
      <Sidebar />
      <section className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-[#B7F4A8] opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#A5D8FF] opacity-60 blur-3xl" />
          <div className="absolute top-24 right-1/3 h-40 w-40 rounded-full bg-[#FFE3E2] opacity-70 blur-2xl" />
        </div>

        <div className="relative flex h-full flex-col">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12 md:px-12">
            <header className="flex flex-col gap-6">
              <span className="inline-flex items-center gap-2 self-start rounded-full border-4 border-black/10 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.35em] text-emerald-600 shadow-[0_10px_0_rgba(0,0,0,0.12)]">
                🎈 Playful learning
              </span>
              <div className="space-y-4">
                <h1 className="text-5xl font-extrabold leading-tight md:text-6xl md:leading-[1.05]">
                  Learn anything the way your favorite character would explain it.
                </h1>
                <p className="max-w-3xl text-lg font-medium text-slate-700 md:text-xl">
                  Pick a tutor, ask a question with your voice, and watch friendly explanations and concept maps blossom—just like the Duolingo owl cheering you on.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
                <span className="inline-flex items-center gap-2 rounded-full border-4 border-slate-900/10 bg-white px-4 py-2 shadow-[0_12px_0_rgba(0,0,0,0.08)]">
                  🧠 Concept chains
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border-4 border-slate-900/10 bg-white px-4 py-2 shadow-[0_12px_0_rgba(0,0,0,0.08)]">
                  🎤 Voice-first chats
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border-4 border-slate-900/10 bg-white px-4 py-2 shadow-[0_12px_0_rgba(0,0,0,0.08)]">
                  ✨ Kid-friendly language
                </span>
              </div>
            </header>

            <div className="grow">
              <div className="relative rounded-[3rem] border-4 border-black/10 bg-white/80 p-6 shadow-[0_25px_0_rgba(0,0,0,0.08)] backdrop-blur">
                <div className="absolute -top-8 left-10 inline-flex items-center gap-2 rounded-full border-4 border-emerald-500/30 bg-emerald-300/80 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-emerald-900 shadow-[0_10px_0_rgba(16,185,129,0.4)]">
                  Choose a guide ↓
                </div>
                <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-3">
                  <AvatarCard teacher="spongebob" />
                  <AvatarCard teacher="peter" />
                  <AvatarCard teacher="dora" />
                </div>
              </div>
            </div>

            <footer className="flex flex-col gap-4 pb-6 text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                ✅ Guided by AI + your imagination
              </span>
              <span className="inline-flex items-center gap-2">
                🔐 We only keep chats so your concept chains stick around
              </span>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

