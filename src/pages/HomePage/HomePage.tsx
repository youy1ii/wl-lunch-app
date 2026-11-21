import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Trophy, ThumbsDown, Megaphone, Bell, Users } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import type { INotification } from '@/lib/types';
import { avgOf, tierOf, tierLabel, votesOf } from '@/lib/mock-data';
import type { IDish } from '@/lib/types';
import { cn, fmtBJT } from '@/lib/utils';
import { t } from '@/lib/i18n';
import AdminGroupChat from '@/components/AdminGroupChat';

// 通知时间是数据库 ISO 原文（如 2026-11-19T15:12:15.016632+00:00），
// 直接显示会撑破窄下拉面板。统一压成「11-19 15:12」短格式。
function shortTime(iso: string): string {
  return fmtBJT(iso);
}

const PODIUM = [
  { rank: 1, color: '#F5C518', barH: 'h-28' },
  { rank: 2, color: '#C0C7D1', barH: 'h-20' },
  { rank: 3, color: '#D08A4E', barH: 'h-16' },
];

function PodiumBlock({
  title,
  list,
  good,
  onOpen,
  lang,
}: {
  title: string;
  list: IDish[];
  good: boolean;
  onOpen: (id: number) => void;
  lang: 'zh' | 'ja' | 'en';
}) {
  return (
    <div className="card-solid mt-5 rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-5 flex items-center gap-1.5 text-base font-black">
        {good ? (
          <Trophy size={16} style={{ color: '#F5C518' }} />
        ) : (
          <ThumbsDown size={16} style={{ color: '#C13584' }} />
        )}
        {title}
      </div>
      <div className="flex items-end justify-center gap-3">
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
              className="anim-pop pressable flex w-24 flex-col items-center"
              style={{ animationDelay: `${r * 100}ms` }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white"
                style={{ background: color }}
              >
                {r}
              </div>
              <div className="mt-2 max-w-full truncate text-sm font-bold">{d.name}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-black" style={{ color }}>
                  {avgOf(d).toFixed(1)}
                </span>
                <span className="text-[11px] text-muted-foreground">{votesOf(d)} {t(lang, 'votes')}</span>
              </div>
              <div
                className={cn('mt-2 flex w-full items-start justify-center rounded-t-lg pt-1.5 text-xs font-bold text-white/90 ring-1 ring-black/5', meta.barH)}
                style={{ background: `linear-gradient(180deg, ${color}, ${color}99)` }}
              >
                {tierLabel(tier.score, lang)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { banners, dishes, ticker, notifications, markAllNotificationsRead, isAdmin, settings, user } = useApp();
  const [idx, setIdx] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failedBanners, setFailedBanners] = useState<Set<number>>(new Set());
  const [showNotif, setShowNotif] = useState(false);
  const [emailDetail, setEmailDetail] = useState<INotification | null>(null);
  const [showGroup, setShowGroup] = useState(false);
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
    <div className="h-full overflow-y-auto p-5">
      {/* 顶栏：标题 + 通知铃 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">
          WL <span style={{ color: 'var(--primary)' }}>Lunch</span>
        </h1>
        <div className="flex items-center gap-2">
          {(isAdmin || user?.username === 'WLLC2026' || user?.uid === '00000000') && (
            <button
              type="button"
              onClick={() => setShowGroup(true)}
              className="pressable relative flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5"
              style={{ background: 'var(--card)', color: 'var(--primary)' }}
            >
              <Users size={18} />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                群
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowNotif((v) => !v);
              markAllNotificationsRead();
            }}
            className="pressable relative flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5" style={{ background: 'var(--card)' }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D2E] text-[9px] font-black text-white">
                {unread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 通知下拉：三类分组 */}
      {showNotif && (
        <div className="anim-pop absolute right-4 top-16 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-xl p-2 shadow-xl ring-1 ring-black/10" style={{ background: 'var(--card)' }}>
          {notifications.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">暂无通知</div>
          )}
          {([
            { kind: 'like' as const, label: '收到的赞', color: '#FF4D6D' },
            { kind: 'reply' as const, label: '新回复', color: '#38B6FF' },
            { kind: 'admin' as const, label: '管理员私信', color: '#E8B923' },
            { kind: 'feedback' as const, label: '反馈回复', color: '#22C55E' },
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
                  <div key={n.id} className="pressable rounded-b-lg px-2 py-2 text-xs leading-relaxed hover:bg-muted" onClick={() => { if (n.kind === 'feedback') setEmailDetail(n); else if (n.kind === 'admin') navigate('/announcements'); else if (n.kind === 'reply') navigate('/me'); setShowNotif(false); markAllNotificationsRead(); }}>
                    <div className="text-muted-foreground">{shortTime(n.time)}</div>
                    <div className="mt-0.5 break-words">{n.text}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 邮件样式详情 */}
      {emailDetail && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={() => setEmailDetail(null)}>
          <div className="anim-rise w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 text-xs text-muted-foreground">@{emailDetail.adminRep || '管理员'}</div>
            <h3 className="mb-2 text-sm font-black">关于你的反馈</h3>
            <p className="text-sm leading-relaxed">{emailDetail.feedbackText}</p>
            <div className="my-3 border-t border-border" />
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">↳</span>
              <p className="flex-1 text-sm text-success">{emailDetail.replyText}</p>
            </div>
            <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-black text-primary">{(emailDetail.adminRep || 'A').slice(0,1).toUpperCase()}</div>
              <span>{emailDetail.adminRep}</span>
              <span>· {emailDetail.replyTime ? fmtBJT(emailDetail.replyTime) : ''}</span>
            </div>
          </div>
        </div>,
        document.body,
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
          {banners.map((b) => {
            const showImage = !!b.image && !failedBanners.has(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => go(b.target)}
                className="relative h-48 w-full shrink-0 overflow-hidden p-5 text-left"
                style={{
                  background: showImage
                    ? `url(${b.image}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #E8B923, #D97706 60%, #F5E3B3)',
                }}
              >
                {showImage && (
                  <img
                    src={b.image!}
                    alt={b.title}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    onError={() => setFailedBanners((prev) => new Set(prev).add(b.id))}
                  />
                )}
                {!showImage && <div className="dots-bg-fine absolute inset-0 opacity-30" />}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                {!showImage && <div className="relative text-xl font-black text-white drop-shadow-lg">{b.title}</div>}
              </button>
            );
          })}
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
      <div className="card-solid mt-4 flex items-center gap-2.5 overflow-hidden rounded-full px-4 py-2.5 ring-1 ring-black/5">
        <Megaphone size={16} className="shrink-0 text-primary" />
        <div className="relative flex-1 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap text-sm">
            <span className="pr-8">{ticker}</span>
            <span className="pr-8">{ticker}</span>
          </div>
        </div>
      </div>

      {/* 两个领奖台 */}
      <div className="pb-4">
        <PodiumBlock title={t(settings.lang, 'lovedTop3')} list={loves} good lang={settings.lang} onOpen={(id) => navigate(`/dishes/${id}`)} />
        <PodiumBlock title={t(settings.lang, 'hatedTop3')} list={hates} good={false} lang={settings.lang} onOpen={(id) => navigate(`/dishes/${id}`)} />
      </div>

      <AdminGroupChat open={showGroup} onClose={() => setShowGroup(false)} />
    </div>
  );
}
