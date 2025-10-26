import Sidebar from './components/Sidebar';
import { AvatarCard } from './components/AvatarCard';

export default function Page() {
  return (
    <main className="h-dvh flex">
      <Sidebar />
      <section className="flex-1 p-6 md:p-10">
        <div className="card h-full flex flex-col">
          <header className="px-6 md:px-10 pt-6 md:pt-8">
            <h1 className="text-3xl md:text-4xl font-extrabold">Explain it to me like I'm 5</h1>
            <p className="text-gray-500 mt-1">choose your teacher</p>
          </header>
          <div className="flex-1 grid place-items-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10 w-full max-w-4xl px-6 pb-12">
              <AvatarCard teacher="spongebob" />
              <AvatarCard teacher="peter" />
              <AvatarCard teacher="edna" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

