import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** 设置类页面统一头部：磨砂圆形返回按钮 + 标题 + 可选副标题/右侧操作。
 * 只做视觉统一，不含任何业务逻辑，回调沿用各页面自己的 navigate。 */
export default function SettingsHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <header className={cn('mb-4 flex items-center gap-3', className)}>
      <button
        type="button"
        aria-label="返回"
        onClick={() => navigate(-1)}
        className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-black/5"
      >
        <ChevronLeft size={19} strokeWidth={2.4} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-black leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
