import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';

export default function AnnouncementsPage() {
  const { announcements } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">公告</h1>
      </div>
      <div className="space-y-3 overflow-y-auto">
        {announcements.map((a) => (
          <div key={a.id} className="card-solid rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-black">{a.title}</h3>
              <span className="text-xs text-muted-foreground">{a.date}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
