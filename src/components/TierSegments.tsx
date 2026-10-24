import { TIERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/haptics';

interface Props {
  selected?: number; // 1-5
  interactive?: boolean;
  haptics?: boolean;
  onSelect?: (tier: number) => void;
}

// 横向五档条（苹果音量键横放样式）
export default function TierSegments({ selected, interactive, haptics, onSelect }: Props) {
  return (
    <div className="flex items-end gap-1.5">
      {TIERS.map((t) => {
        const active = selected === t.score;
        return (
          <button
            key={t.score}
            type="button"
            disabled={!interactive}
            onClick={() => {
              buzz(haptics ?? true, [8, 20, 8]);
              onSelect?.(t.score);
            }}
            className={cn(
              'flex-1 rounded-lg border transition-all duration-150',
              interactive ? 'cursor-pointer active:scale-95' : 'cursor-default',
              active ? 'border-transparent' : 'border-transparent opacity-35',
            )}
            style={{
              background: t.color,
              height: 26 + t.score * 7,
            }}
          >
            <span
              className="block text-[10px] font-bold leading-none text-white"
              style={{ marginTop: 4 }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
