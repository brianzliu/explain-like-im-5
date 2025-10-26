export default function Sidebar() {
  return (
    <aside className="sidebar hidden md:flex flex-col p-4 gap-3">
      <div className="text-sm font-semibold text-gray-500">conversations</div>
      <button className="voice-button !px-4 !py-2">New</button>
      <div className="text-gray-400 text-sm">No conversations yet</div>
    </aside>
  );
}

