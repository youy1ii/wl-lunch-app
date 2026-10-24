import { useRef, useState } from 'react';
import { TIERS, tierIndexOf, tierOf } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// 索引对齐 TIERS：0=夯 … 4=拉完了
function quotesFor(name: string): string[] {
  return [
    '这简直太好吃暴力清空！！',
    '我！还！想！吃！',
    `回答我！${name}！`,
    '还行吧。',
    `喂，你这家伙吃${name}吃得蛮开心的嘛`,
  ];
}

function buzz(on: boolean, pattern: number | number[] = [8, 20, 8]) {
  if (!on || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

export default function RatingSlider({
  value,
  onChange,
  haptics,
  dishName,
}: {
  value: number;
  onChange: (v: number) => void;
  haptics: boolean;
  dishName: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragScore, setDragScore] = useState<number | null>(null);
  const [dragTierIdx, setDragTierIdx] = useState(-1);

  const shown = dragScore ?? (value === 0 ? 1 : value);
  const shownTier = tierOf(Math.max(0.5, shown));
  const shownTierIdx = tierIndexOf(Math.max(0.5, shown));

  const fromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return 1 + ratio * 4;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const s = fromEvent(e.clientX);
    setDragScore(s);
    setDragTierIdx(tierIndexOf(Math.max(0.5, s)));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragScore === null) return;
    const s = fromEvent(e.clientX);
    setDragScore(s);
    const idx = tierIndexOf(Math.max(0.5, s));
    if (idx !== dragTierIdx) {
      setDragTierIdx(idx);
      buzz(haptics, 12);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = fromEvent(e.clientX);
    const snapped = Math.max(1, Math.min(5, Math.round(s)));
    onChange(snapped);
    setDragScore(null);
    setDragTierIdx(-1);
    buzz(haptics);
  };

  const ratio = (shown - 1) / 4;

  return (
    <div className="w-full select-none px-1 py-2">
      {/* 巨大数字 */}
      <div className="mb-5 mt-2 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span
            className="text-8xl font-black leading-none transition-colors duration-200"
            style={{ color: shownTier.color }}
          >
            {shown.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
        </div>
      </div>

      {/* 进度条：整条渐变填充 */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative flex h-14 cursor-pointer items-center touch-none"
      >
        <div
          className="h-4 w-full rounded-full transition-colors duration-200"
          style={{
            background: `linear-gradient(90deg, ${shownTier.color}33, ${shownTier.color})`,
          }}
        />
        {/* 拇指 */}
        <div
          className={cn(
            'absolute h-8 w-8 -translate-x-1/2 rounded-full border-4 border-white shadow-lg transition-transform',
            dragScore !== null && 'scale-125',
          )}
          style={{ left: `${ratio * 100}%`, background: shownTier.color }}
        />
      </div>

      {/* 档位字和评语挪到下面 */}
      <div className="mt-5 flex flex-col items-center">
        <div
          key={shownTierIdx}
          className="anim-pop rounded-full px-4 py-1 text-lg font-black text-white"
          style={{ background: shownTier.color }}
        >
          {shownTier.label}
        </div>
        <div className="mt-2 h-5 text-center text-xs text-muted-foreground">{quotesFor(dishName)[shownTierIdx]}</div>
      </div>

      {/* 五档刻度：彩色小圆点，左=拉完了 右=夯 */}
      <div className="mt-3 flex items-center justify-between px-2">
        {[...TIERS].reverse().map((tt) => (
          <span
            key={tt.score}
            title={tt.label}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: tt.color }}
          />
        ))}
      </div>
    </div>
  );
}
