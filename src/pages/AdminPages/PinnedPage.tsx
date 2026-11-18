import { Pin, Megaphone } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { cn } from '@/lib/utils';
import AdminSubPage, { AdminCard } from '@/components/AdminSubPage';

export default function PinnedPage() {
  const { announcements, togglePin } = useApp();
  const pinned = announcements.filter((a) => a.pinned);

  return (
    <AdminSubPage title="置顶公告" subtitle="置顶后固定在评论区顶部显示">
      <AdminCard>
        {pinned.length > 0 && (
          <div className="mb-4 rounded-xl bg-primary/10 p-3">
            <p className="text-xs font-bold text-primary">当前置顶 {pinned.length} 条</p>
            {pinned.map((a) => <p key={a.id} className="mt-1 truncate text-sm font-bold">📌 {a.title}</p>)}
          </div>
        )}
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Megaphone size={48} strokeWidth={1.3} />
            <p className="text-sm">还没有公告，请先到「公告管理」发布</p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{a.title}</span>
                <button
                  type="button"
                  onClick={() => togglePin(a.id)}
                  className={cn(
                    'pressable flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold',
                    a.pinned ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
                  )}
                >
                  <Pin size={12} /> {a.pinned ? '已置顶' : '置顶'}
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminSubPage>
  );
}
