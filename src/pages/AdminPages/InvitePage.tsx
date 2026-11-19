import { useState } from 'react';
import { Ticket, RefreshCw } from 'lucide-react';
import AdminSubPage, { AdminCard, AdminPrimaryButton } from '@/components/AdminSubPage';
import { t } from '@/lib/i18n';
import { useApp } from '@/lib/store-context';

export default function InvitePage() {
  const { settings } = useApp();
  const lang = settings.lang;
  const [inviteCodes, setInviteCodes] = useState<{ code: string; used: boolean }[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wl-lunch:invite-codes') || 'null');
      if (saved && Array.isArray(saved) && saved.length === 8) return saved;
    } catch {}
    return [];
  });

  const gen = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes = Array.from({ length: 8 }, () => {
      let code = '';
      for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return { code, used: false };
    });
    localStorage.setItem('wl-lunch:invite-codes', JSON.stringify(codes));
    setInviteCodes(codes);
  };

  return (
    <AdminSubPage title={t(lang,'管理员邀请码')} subtitle={t(lang,'每个码只能用一次，刷新后旧码失效')}>
      <AdminCard>
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-amber-500/10 p-3.5">
          <Ticket size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(lang,'这些邀请码保存在本机浏览器中，仅用于当场演示。')}<b className="text-foreground">{t(lang,'发给学生无效')}</b>{t(lang,'，学生扫码不会获得管理员权限。')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {inviteCodes.length === 0 && (
            <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">{t(lang,'点击下方按钮生成 8 个邀请码')}</p>
          )}
          {inviteCodes.map((ic) => (
            <div
              key={ic.code}
              className={`rounded-xl px-3 py-2.5 text-center font-mono text-sm tracking-wider ${
                ic.used ? 'bg-muted/50 text-muted-foreground line-through' : 'bg-primary/10 font-bold text-primary'
              }`}
            >
              {ic.code}
            </div>
          ))}
        </div>
        <div className="mt-6">
          <AdminPrimaryButton onClick={gen}>
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={16} /> {inviteCodes.length === 0 ? t(lang,'生成 8 个邀请码') : t(lang,'刷新 8 个新邀请码')}
            </span>
          </AdminPrimaryButton>
        </div>
      </AdminCard>
    </AdminSubPage>
  );
}
