import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { IAnnouncement } from '@/lib/types';

export default function AnnouncePopup({ announcement }: { announcement: IAnnouncement }) {
  const { markAnnouncementRead, settings } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setCanClose(true);
    };
    el.addEventListener('scroll', check);
    const raf = requestAnimationFrame(check);
    return () => {
      el.removeEventListener('scroll', check);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="card-solid w-full max-w-md rounded-2xl p-5" style={{ maxHeight: '78%' }}>
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t(settings.lang, 'announcements')}
        </div>
        <h2 className="mb-3 text-center text-lg font-black">{announcement.title}</h2>
        <div
          ref={scrollRef}
          className="dots-bg-fine max-h-72 overflow-y-auto rounded-xl bg-muted p-4 text-sm leading-relaxed"
        >
          {announcement.imageUrl && (
            <img
              src={announcement.imageUrl}
              alt="公告配图"
              className="mb-3 w-full rounded-lg object-cover"
            />
          )}
          {announcement.body.split('\n').map((line, i) => (
            <p key={i} className="mb-2">
              {line}
            </p>
          ))}
          {announcement.linkUrl && (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-bold text-primary underline"
            >
              🔗 点击查看详情 →
            </a>
          )}
          <p className="pt-2 text-center text-xs text-muted-foreground">—— 到底啦 ——</p>
        </div>
        <button
          type="button"
          disabled={!canClose}
          onClick={() => markAnnouncementRead(announcement.id)}
          className={cn(
            'mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity',
            canClose ? 'bg-primary opacity-100' : 'bg-muted-foreground opacity-40',
          )}
        >
          {t(settings.lang, 'readAll')}
        </button>
      </div>
    </div>
  );
}
