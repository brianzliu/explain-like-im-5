import Sidebar from '../../components/Sidebar';
import VoicePanel from './voice-panel';

export default function TeacherPage({ params }: { params: { teacher: string } }) {
  const teacher = params.teacher as 'spongebob' | 'peter' | 'edna';
  return (
    <main className="h-dvh flex">
      <Sidebar />
      <section className="flex-1 p-6 md:p-10">
        <div className="card h-full p-6 md:p-10 flex flex-col">
          <VoicePanel teacher={teacher} />
        </div>
      </section>
    </main>
  );
}

