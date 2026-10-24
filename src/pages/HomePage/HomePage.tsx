import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ThumbsDown, Megaphone, Bell } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { avgOf, tierOf, votesOf } from '@/lib/mock-data';
import type { IDish } from '@/lib/types';
import { cn } from '@/lib/utils';

const PODIUM = [
  { rank: 1, color: '#F5C518', barH: 'h-24' },
  { rank: 2, color: '#C0C7D1', barH: 'h-16' },
  { rank: 3, color: '#D08A4E', barH: 'h-14' },
];

function PodiumBlock({
  title,
  list,
  good,
  onOpen,
}: {
  title: string;
  list: IDish[];
  good: boolean;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="card-solid mt-4 rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-center gap-1.5 text-sm font-black">
        {good ? (
          <Trophy size={16} style={{ color: '#F5C518' }} />
        ) : (
          <ThumbsDown size={16} style={{ color: '#C13584' }} />
        )}
        {title}
      </div>
      <div className="flex items-end justify-center gap-2">
        {[2, 1, 3].map((r) => {
          const d = list[r - 1];
          if (!d) return <div key={r} className="w-24" />;
          const meta = PODIUM[r - 1];
          const tier = tierOf(avgOf(d));
          const color = good ? meta.color : ['#8A94A6', '#C13584', '#B0709A'][r - 1];
          return (
            <button
              key={r}
              type="button"
              onClick={() => onOpen(d.id)}
              className="anim-pop pressable flex w-20 flex-col items-center"
              style={{ animationDelay: `${r * 100}ms` }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-white"
                style={{ background: color }}
              >
                {r}
              </div>
              <div className="mt-1.5 max-w-full truncate text-xs font-bold">{d.name}</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-base font-black" style={{ color }}>
                  {avgOf(d).toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-foreground">{votesOf(d)}票</span>
              </div>
              <div
                className={cn('mt-1.5 flex w-full items-start justify-center rounded-t-lg pt-1 text-[10px] font-bold text-white/90 ring-1 ring-black/5', meta.barH)}
                style={{ background: `linear-gradient(180deg, ${color}, ${color}99)` }}
              >
                {tier.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { banners, dishes, ticker, notifications, markAllNotificationsRead } = useApp();
  const [idx, setIdx] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();
  const dragState = useRef<number>(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % banners.length), 3500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const didDrag = useRef(false);

  const go = (target: string) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    if (/^https?:\/\//.test(target)) window.open(target, '_blank');
    else navigate(target);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragState.current;
    if (Math.abs(dx) > 8) didDrag.current = true;
    setDragDx(dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragState.current;
    setDragging(false);
    setDragDx(0);
    if (Math.abs(dx) < 40) return;
    setIdx((i) => (dx > 0 ? (i - 1 + banners.length) % banners.length : (i + 1) % banners.length));
  };

  const ranked = dishes.filter((d) => votesOf(d) >= 5).sort((a, b) => avgOf(b) - avgOf(a));
  const loves = ranked.slice(0, 3);
  const hates = [...ranked].slice(-3).reverse();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-full flex-col p-4">
      {/* 顶栏：标题 + 通知铃 */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">
          WL <span style={{ color: 'var(--primary)' }}>Lunch</span>
        </h1>
        <button
          type="button"
          onClick={() => {
            setShowNotif((v) => !v);
            markAllNotificationsRead();
          }}
          className="pressable relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5" style={{ background: 'var(--card)' }}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D2E] text-[9px] font-black text-white">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* 通知下拉：三类分组 */}
      {showNotif && (
        <div className="anim-pop absolute right-4 top-16 z-40 w-72 rounded-xl p-2 shadow-xl ring-1 ring-black/10" style={{ background: 'var(--card)' }}>
          {([
            { kind: 'like' as const, label: '收到的赞', color: '#FF4D6D' },
            { kind: 'reply' as const, label: '新回复', color: '#38B6FF' },
            { kind: 'admin' as const, label: '管理员私信', color: '#E8B923' },
          ]).map((grp) => {
            const list = notifications.filter((n) => n.kind === grp.kind);
            if (list.length === 0) return null;
            return (
              <div key={grp.kind} className="mb-1 last:mb-0">
                <div
                  className="rounded-t-lg px-2 py-1 text-[10px] font-black tracking-wider"
                  style={{ color: grp.color, background: `${grp.color}18` }}
                >
                  {grp.label}
                </div>
                {list.map((n) => (
                  <div key={n.id} className="rounded-b-lg px-2 py-2 text-xs leading-relaxed hover:bg-muted">
                    <div className="text-muted-foreground">{n.time}</div>
                    <div className="mt-0.5">{n.text}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Banner：跟手拖动 */}
      <div
        className="relative touch-pan-y overflow-hidden rounded-2xl ring-1 ring-black/10"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(-${idx * 100}% + ${dragDx}px))`,
            transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {banners.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => go(b.target)}
              className="relative h-44 w-full shrink-0 overflow-hidden p-5 text-left"
              style={
                b.image
                  ? { background: `url(${b.image}) center/cover no-repeat` }
                  : { background: 'linear-gradient(135deg, #E8B923, #D97706 60%, #F5E3B3)' }
              }
            >
              {!b.image && <div className="dots-bg-fine absolute inset-0 opacity-30" />}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative text-xl font-black text-white drop-shadow-lg">{b.title}</div>
            </button>
          ))}
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <span
              key={b.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      </div>

      {/* 常驻滚动通知 */}
      <div className="card-solid mt-3 flex items-center gap-2 overflow-hidden rounded-full px-3 py-2 ring-1 ring-black/5">
        <Megaphone size={14} className="shrink-0 text-primary" />
        <div className="relative flex-1 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap text-xs">
            <span className="pr-8">{ticker}</span>
            <span className="pr-8">{ticker}</span>
          </div>
        </div>
      </div>

      {/* 两个领奖台 */}
      <div className="flex-1 overflow-y-auto pb-4">
        <PodiumBlock title="全校最爱 TOP3" list={loves} good onOpen={(id) => navigate(`/dishes/${id}`)} />
        <PodiumBlock title="全校最拉 TOP3" list={hates} good={false} onOpen={(id) => navigate(`/dishes/${id}`)} />
      </div>
    </div>
  );
}
