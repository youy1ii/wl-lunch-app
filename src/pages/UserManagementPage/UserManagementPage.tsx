import { ShieldBan, Send } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/store-context';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import SettingsHeader from '@/components/SettingsHeader';

export default function UserManagementPage() {
  const { user, banUser, sendAdminMessage , settings} = useApp();
  const lang = settings.lang;
  const isOwner = user?.uid === '00000000';
  const [targetUid, setTargetUid] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-full flex-col p-4">
      <SettingsHeader title={t(lang,'👤 用户管理')} />

      <div className="space-y-3 overflow-y-auto">
        <div className="card-solid rounded-2xl p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black">{t(lang,'封禁 / 私信用户')}</h2>
          <div className="space-y-2">
            <input
              placeholder={t(lang,'输入用户UID（如 00000001）')}
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
            />
            <textarea
              placeholder={t(lang,'私信内容（可选）')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-20 w-full rounded-lg bg-muted p-3 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!targetUid.trim()) { toast.error(t(lang,'请输入UID')); return; }
                  banUser(targetUid.trim()).then((ok) => {
                    if (ok) { toast.success(t(lang,'已封禁用户 ') + targetUid.trim()); setTargetUid(''); setMessage(''); }
                    else toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive py-2.5 text-xs font-bold text-destructive-foreground pressable"
              >
                <ShieldBan size={14} />
                {t(lang,'封禁账号')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!targetUid.trim()) { toast.error(t(lang,'请输入UID')); return; }
                  if (!message.trim()) { toast.error(t(lang,'请输入私信内容')); return; }
                  sendAdminMessage(targetUid.trim(), message.trim()).then((ok) => {
                    if (ok) { toast.success(t(lang,'已发送私信给 ') + targetUid.trim()); setTargetUid(''); setMessage(''); }
                    else toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground pressable"
              >
                <Send size={14} />
                {t(lang,'发送私信')}
              </button>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="card-solid rounded-2xl p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-black">{t(lang,'说明')}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(lang,'• 封禁后该用户将无法登录')}<br/>
              {t(lang,'• 私信会以管理员身份发送给指定用户')}<br/>
              {t(lang,'• 此页面仅管理员可见')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
