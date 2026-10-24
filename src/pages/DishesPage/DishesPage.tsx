import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Leaf } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { avgOf, tierOf, votesOf, WINDOWS, TIERS } from '@/lib/mock-data';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { WindowId } from '@/lib/types';

type PriceBand = 'all' | 'cheap' | 'mid' | 'dear';
type MeatKind = 'all' | 'meat' | 'veggie';

const HEAD_H = 'h-28';

export default function DishesPage() {
  const { dishes, settings, myRatings } = useApp();
  const [query, setQuery] = useState('');
  const [win, setWin] = useState<'all' | WindowId>('all');
  const [price, setPrice] = useState<PriceBand>('all');
  const [meat, setMeat] = useState<MeatKind>('all');
  const [ratedOnly, setRatedOnly] = useState(false);
  const [searchVisible, setSearchVisible] = useState(true);
  const lastScroll = useRef(0);
  const navigate = useNavigate();

  const list = useMemo(() => {
    return dishes
      .filter((d) => (win === 'all' ? true : d.windowId === win))
      .filter((d) => (query.trim() ? d.name.includes(query.trim()) : true))
      .filter((d) => {
        if (price === 'cheap') return d.price <= 10;
        if (price === 'mid') return d.price > 10 && d.price <= 20;
        if (price === 'dear') return d.price > 20;
        return true;
      })
      .filter((d) => {
        if (meat === 'meat') return !d.veggie;
        if (meat === 'veggie') return d.veggie;
        return true;
      })
      .filter((d) => (ratedOnly ? myRatings[d.id] !== undefined : true))
      .sort((a, b) => avgOf(b) - avgOf(a));
  }, [dishes, win, query, price, meat, ratedOnly, myRatings]);

  const chip = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold pressable transition-all',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'bg-card text-muted-foreground ring-1 ring-black/5 hover:text-foreground',
    );

  return (
    <div className="flex h-full flex-col p-4">
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{ maxHeight: searchVisible ? '300px' : '0px', opacity: searchVisible ? 1 : 0 }}
      >
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(settings.lang, 'searchDish')}
            className="w-full rounded-2xl bg-card py-3 pl-9 pr-3 text-sm shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 窗口分类 */}
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          <button type="button" onClick={() => setWin('all')} className={chip(win === 'all')}>
            {t(settings.lang, 'allWindows')}
          </button>
          {WINDOWS.map((w) => (
            <button key={w.id} type="button" onClick={() => setWin(w.id)} className={chip(win === w.id)}>
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* 条件筛选：价格 + 荤素 */}
      <div className="mb-3 space-y-1.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button type="button" onClick={() => setPrice('all')} className={chip(price === 'all')}>全部价格</button>
          <button type="button" onClick={() => setPrice('cheap')} className={chip(price === 'cheap')}>≤¥10</button>
          <button type="button" onClick={() => setPrice('mid')} className={chip(price === 'mid')}>¥10–20</button>
          <button type="button" onClick={() => setPrice('dear')} className={chip(price === 'dear')}>&gt;¥20</button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button type="button" onClick={() => setMeat('all')} className={chip(meat === 'all')}>荤素不限</button>
          <button type="button" onClick={() => setMeat('meat')} className={chip(meat === 'meat')}>荤菜</button>
          <button
            type="button"
            onClick={() => setMeat('veggie')}
            className={cn(chip(meat === 'veggie'), meat === 'veggie' && '!bg-emerald-500 !text-white')}
          >
            <span className="flex items-center gap-1">
              <Leaf size={11} />
              素菜专区
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRatedOnly((v) => !v)}
            className={cn(chip(ratedOnly), ratedOnly && '!bg-primary !text-primary-foreground')}
          >
            <span className="flex items-center gap-1">
              ★ 我打过的
            </span>
          </button>
        </div>
      </div>

      <div className="grid flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto pb-4">
        {list.map((d, i) => {
          const avg = avgOf(d);
          const tier = tierOf(avg);
          const headH = HEAD_H;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => navigate(`/dishes/${d.id}`)}
              className={cn(
                'card-solid anim-rise overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-black/5 pressable transition-transform',
                d.isNew && 'ring-2 ring-amber-400 shadow-amber-300/50',
              )}
              style={{
                animationDelay: `${Math.min(i, 8) * 50}ms`,
                boxShadow: d.isNew ? '0 0 20px rgba(251,191,36,0.5)' : undefined,
              }}
            >
              <div
                className={cn('relative flex items-center justify-center text-3xl font-black text-white/90', headH)}
                style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}88)` }}
              >
                {d.name.slice(0, 1)}
                <span className="absolute right-2 top-2 flex gap-1">
                  {d.isNew && (
                    <span className="flex h-5 items-center rounded-full bg-red-500 px-1.5 text-[9px] font-black text-white animate-pulse">
                      新品
                    </span>
                  )}
                  {myRatings[d.id] && (
                    <span
                      className="flex h-5 items-center rounded-full bg-white/90 px-1.5 text-[9px] font-black"
                      style={{ color: TIERS[5 - myRatings[d.id]].color }}
                    >
                      我·{TIERS[5 - myRatings[d.id]].label}
                    </span>
                  )}
                  {d.veggie && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-emerald-600">
                      <Leaf size={11} />
                    </span>
                  )}
                </span>
              </div>
              <div className="p-2.5">
                <div className="truncate text-sm font-bold">{d.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs font-black text-primary">¥{d.price}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-base font-black shadow-sm"
                    style={{ color: tier.color, background: tier.color + '22' }}
                  >
                    {avg.toFixed(1)}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {votesOf(d)} {t(settings.lang, 'votes')}
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
            {ratedOnly ? (
              <p>哎呀，好像还没打过分呢！</p>
            ) : (
              <p>
                没有找到想打分的菜品？
                <Link to="/feedback" className="font-bold text-primary underline">
                  点击这里联系管理员！
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
