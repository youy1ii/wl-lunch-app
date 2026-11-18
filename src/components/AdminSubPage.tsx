import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 管理后台独立子页统一外壳：返回管理首页 + 宽松内容区
export default function AdminSubPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
          aria-label="返回管理首页"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">{children}</div>
    </div>
  );
}

// 统一的卡片容器（宽松内边距）
export function AdminCard({ children }: { children: ReactNode }) {
  return <section className="card-solid rounded-2xl p-6 shadow-sm">{children}</section>;
}

// 统一的主按钮
export function AdminPrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl bg-primary py-3.5 text-[15px] font-black text-primary-foreground pressable disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

// 统一输入样式类，供各页复用
export const inputCls =
  'w-full rounded-xl border border-border/60 bg-muted px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-primary';
