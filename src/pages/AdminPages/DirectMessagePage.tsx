import { useState } from 'react';
import { Send, Users } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { toast } from 'sonner';
import AdminSubPage, { AdminCard, AdminPrimaryButton, inputCls } from '@/components/AdminSubPage';
import { t } from '@/lib/i18n';

export default function DirectMessagePage() {
  const { sendAdminMessage , settings} = useApp();
  const lang = settings.lang;
  const [target, setTarget] = useState('');
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    sendAdminMessage(target.trim(), text.trim()).then((ok) => {
      if (ok) { setTarget(''); setText(''); toast.success(t(lang,'已发送')); }
      else toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
    });
  };

  return (
    <AdminSubPage title={t(lang,'私信广播')} subtitle={t(lang,'给指定学生发私信，或全员广播')}>
      <AdminCard>
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-primary/10 p-3.5">
          <Users size={20} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <b className="text-foreground">{t(lang,'留空 UID = 全员广播')}</b>{t(lang,'，所有学生都会收到通知。填入 UID 则只发给该学生。')}
          </p>
        </div>

        <label className="mb-2 block text-xs font-bold text-muted-foreground">{t(lang,'对方 UID（留空广播全员）')}</label>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t(lang,'例如：47106707')} className={inputCls} />

        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'消息内容')}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang,'写点什么……')}
          className={`${inputCls} h-32 resize-none`}
        />

        <div className="mt-6">
          <AdminPrimaryButton disabled={!text.trim()} onClick={send}>
            <span className="inline-flex items-center gap-2"><Send size={16} />{t(lang,'发送消息')}</span>
          </AdminPrimaryButton>
        </div>
      </AdminCard>
    </AdminSubPage>
  );
}
