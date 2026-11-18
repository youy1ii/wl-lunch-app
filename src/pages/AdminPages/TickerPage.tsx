import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import AdminSubPage, { AdminCard, AdminPrimaryButton, inputCls } from '@/components/AdminSubPage';

export default function TickerPage() {
  const { ticker, setTicker, settings } = useApp();
  const [draft, setDraft] = useState('');
  const lang = settings.lang;

  return (
    <AdminSubPage title="滚动通知" subtitle="首页常驻小喇叭，所有学生可见">
      <AdminCard>
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-primary/10 p-4">
          <BellRing size={22} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary">当前通知</p>
            <p className="mt-1 break-words text-sm font-black">{ticker || '（未设置）'}</p>
          </div>
        </div>
        <label className="mb-2 block text-xs font-bold text-muted-foreground">新通知内容</label>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="输入要滚动显示的通知"
          className={inputCls}
        />
        <p className="mt-2 text-xs text-muted-foreground">建议控制在 30 字以内，过长会滚动显示不全。</p>
        <div className="mt-5">
          <AdminPrimaryButton
            disabled={!draft.trim()}
            onClick={() => {
              setTicker(draft.trim()).then((ok) => {
                if (ok) { setDraft(''); toast.success(t(lang, 'saved')); }
                else toast.error('PRTS代理指挥失败。请检查网络再次尝试');
              });
            }}
          >
            发布通知
          </AdminPrimaryButton>
        </div>
      </AdminCard>
    </AdminSubPage>
  );
}
