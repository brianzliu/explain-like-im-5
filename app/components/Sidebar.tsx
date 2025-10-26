'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CHATS_PER_PAGE = 20;

export default function Sidebar() {
  const [chats, setChats] = useState<Array<{ id: string; teacher: string; createdAt: string }>>([]);
  const [visibleCount, setVisibleCount] = useState(CHATS_PER_PAGE);
  
  useEffect(() => {
    fetch('/api/chats').then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setChats(data.chats);
    }).catch(() => {});
  }, []);
  
  const visibleChats = chats.slice(0, visibleCount);
  const hasMore = visibleCount < chats.length;
  
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + CHATS_PER_PAGE, chats.length));
  };
  
  return (
    <aside className="sidebar hidden md:flex flex-col p-4 gap-3">
      <div className="text-sm font-semibold text-gray-500">conversations</div>
      <Link href="/" className="voice-button !px-4 !py-2 text-center">New</Link>
      {chats.length === 0 ? (
        <div className="text-gray-400 text-sm">No conversations yet</div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto space-y-1">
            {visibleChats.map((c) => (
              <Link key={c.id} href={`/teachers/${c.teacher}?chatId=${c.id}`} className="block text-sm px-2 py-1 rounded hover:bg-gray-100">
                {new Date(c.createdAt).toLocaleDateString()} · {c.teacher}
              </Link>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 px-3 rounded hover:bg-blue-50 transition"
            >
              Load More ({chats.length - visibleCount} more)
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

