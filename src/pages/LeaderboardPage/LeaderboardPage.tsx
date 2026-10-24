import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { avgOf, tierOf, votesOf, WINDOWS, TIERS } from '@/lib/mock-data';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { WindowId } from '@/lib/types';

const MIN_VOTES = 5;

const MEDAL = [
  { color: '#F5C518', bg: 'linear-gradient(135deg, rgba(245,197,24,0.22), rgba(245,197,24,0.04))' },
  { color: '#C0C7D1', bg: 'linear-gradient(135deg, rgba(192,199,209,0.22), rgba(192,199,209,0.04))' },
  { color: '#D08A4E', bg: 'linear-gradient(135deg, rgba(208,138,78,0.22), rgba(208,138,78,0.04))' },
];

export default function LeaderboardPage() {
  const { dishes, settings, myRatings } = useApp();
  const [query, setQuery] = useState('');
  const [win, setWin] = useState<'all' | WindowId>('all');
  const [mode, setMode] = useState<'love' | 'hate'>('love');
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);

  const pool = useMemo(() => {
    let list = dishes.filter((d) => votesOf(d) >= MIN_VOTES);
    if (win !== 'all') list = list.filter((d) => d.windowId === win);
    if (query.trim()) list = list.filter((d) => d.name.includes(query.trim()));
    return list.sort((a, b) => (mode === 'love' ? avgOf(b) - avgOf(a) : avgOf(a) - avgOf(b)));
  }, [dishes, win, query, mode]);

  const tabs: { id: 'all' | WindowId; name: string }[] = [
    { id: 'all', name: t(settings.lang, 'allWindows') },
    ...WINDOWS.map((w) => ({ id: w.id as WindowId, name: w.name })),
  ];

  return (
    <div className="flex h-full flex-col px-4 pt-4 bg-card">
      {/* 搜索 */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(settings.lang, 'searchDish')}
          className="w-full rounded-2xl bg-card py-3 pl-9 pr-3 text-sm shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* 浏览器窗口 */}
      <div className="flex-1 overflow-hidden rounded-t-2xl rounded-b-none bg-card shadow-sm ring-1 ring-black/5">
        {/* 窗口栏：红绿灯 + 标签 */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <div className="ml-2 flex gap-1">
            {(['love', 'hate'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-t-lg px-3 py-1 text-xs font-bold transition-all pressable',
                  mode === m
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'love' ? '最爱吃' : '最不爱吃'}
              </button>
            ))}
          </div>
        </div>

        {/* 窗口内容 */}
        <div className="h-full overflow-y-auto p-3 pb-28" style={{ height: 'calc(100% - 37px)' }} onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 300)}>
          {/* 窗口分类筛选 */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWin(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-bold pressable transition-all',
                  win === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div key={mode} className="space-y-2">
            {pool.map((dish, i) => {
              const avg = avgOf(dish);
              const tier = tierOf(avg);
              const medal = MEDAL[i];
              const top3 = i < 3;
              if (top3) {
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => navigate(`/dishes/${dish.id}`)}
                    className="anim-pop pressable relative w-full overflow-hidden rounded-2xl p-3 text-left ring-1 transition-transform"
                    style={{
                      animationDelay: `${i * 120}ms`,
                      background: medal.bg,
                      boxShadow: `inset 0 0 0 1.5px ${medal.color}66`,
                    }}
                  >
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20" style={{ background: medal.color }} />
                    <div className="relative flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black text-white shadow-md"
                        style={{ background: medal.color }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-black">{dish.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span
                            className="rounded-full px-2 py-0.5 font-bold text-white"
                            style={{ background: tier.color }}
                          >
                            {tier.label}
                          </span>
                          <span>{votesOf(dish)} 票</span>
                          {myRatings[dish.id] && (
                            <span
                              className="rounded-full px-2 py-0.5 font-bold ring-1"
                              style={{ background: TIERS[5 - myRatings[dish.id]].color + '22', color: TIERS[5 - myRatings[dish.id]].color }}
                            >
                              我评{myRatings[dish.id]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black" style={{ color: medal.color }}>
                          {avg.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-muted-foreground">/ 5.0</div>
                      </div>
                    </div>
                  </button>
                );
              }
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => navigate(`/dishes/${dish.id}`)}
                  className="anim-rise pressable flex w-full items-center gap-2 rounded-xl bg-card p-2.5 text-left ring-1 ring-black/5 transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{dish.name}</span>
                  {myRatings[dish.id] && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: TIERS[5 - myRatings[dish.id]].color + '22', color: TIERS[5 - myRatings[dish.id]].color }}
                    >
                      我{myRatings[dish.id]}
                    </span>
                  )}
                  <span className="text-sm font-black" style={{ color: tier.color }}>
                    {avg.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{tier.label}</span>
                </button>
              );
            })}
            {pool.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t(settings.lang, 'noResult')}
              </p>
            )}
          </div>
        </div>
      </div>
      {createPortal(
        <button
          type="button"
          onClick={() => {
            const sc = document.querySelector('main .overflow-y-auto, [class*="overflow-y-auto"]');
            if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={
            showTop
              ? 'fixed bottom-24 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl pressable anim-pop'
              : 'pointer-events-none fixed bottom-24 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition-opacity'
          }
          aria-label="回到顶部"
        >
          ↑
        </button>,
        document.body,
      )}
    </div>
  );
}
