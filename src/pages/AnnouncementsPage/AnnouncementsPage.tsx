import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';

export default function AnnouncementsPage() {
  const { announcements, settings } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">{t(settings.lang, 'announcements')}</h1>
      </div>
      <div className="space-y-3 overflow-y-auto">
        {announcements.map((a) => {
          const isOwner = a.authorUid === '00000000';
          const authorName = (a as any).authorName || (isOwner ? 'WLLC2026' : '管理员');
          return (
            <div key={a.id} className="card-solid rounded-2xl p-4 shadow-sm">
              {/* Author header */}
              <div className="mb-2 flex items-center gap-2">
                <div className={
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black " +
                  (isOwner
                    ? "bg-emerald-400 text-white ring-2 ring-emerald-400 ring-offset-1 ring-offset-background shadow-emerald-400/60 shadow-md"
                    : "bg-primary text-primary-foreground")
                }>
                  {authorName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    {authorName}
                    <span className={
                      "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black " +
                      (isOwner ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")
                    }>
                      {isOwner ? '总管理员' : '管理员'}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </div>
              <h3 className="font-black">{a.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              {a.imageUrl && <img src={a.imageUrl} alt="" className="mt-2 rounded-xl" />}
              {a.linkUrl && <a href={a.linkUrl} className="mt-2 inline-block text-sm font-bold text-primary">{t(settings.lang, 'viewDetails')} →</a>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
