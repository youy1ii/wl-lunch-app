import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function FeedbackInboxPage() {
  const { feedbacks, replyFeedback, settings, user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'pending' | 'replied'>('all');
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  const filtered = feedbacks.filter(f => tab === 'all' || f.status === tab);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">📬 {t(settings.lang, 'feedbackInbox')}（{feedbacks.length}）</h1>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-2">
        {(['all','pending','replied'] as const).map(tabName => (
          <button key={tabName} type="button" onClick={() => setTab(tabName)}
            className={cn('flex-1 rounded-xl py-1.5 text-xs font-bold', tab === tabName ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            {tabName === 'all' ? t(settings.lang, 'all') : tabName === 'pending' ? t(settings.lang, 'pending') : t(settings.lang, 'replied')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm font-bold text-success">{t(settings.lang, 'noFeedback')}</p>
        )}
        {filtered.map((f) => (
          <div key={f.id} className="mb-2 rounded-xl bg-card p-3 shadow-sm text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold">{f.anonymous ? t(settings.lang, 'anonymous') : <>{f.author} <span className="text-xs text-muted-foreground">· UID:{f.authorUid || "?"} · {f.authorRealName || ""}</span></>}</span>
              <div className="flex gap-1">
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', f.kind === 'complain' ? 'bg-red-500/20 text-red-600' : 'bg-blue-500/20 text-blue-600')}>
                  {f.kind === 'complain' ? t(settings.lang, 'complain') : t(settings.lang, 'suggest')}
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', f.status === 'pending' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success')}>
                  {f.status === 'pending' ? t(settings.lang, 'pending') : t(settings.lang, 'replied')}
                </span>
              </div>
            </div>
            <p className="mt-1">{f.text}</p>
            {f.status === 'pending' ? (
              <div className="mt-2 flex gap-1">
                <input value={replyText[f.id] || ''} onChange={(e) => setReplyText({ ...replyText, [f.id]: e.target.value })} placeholder={t(settings.lang, 'reply')} className="flex-1 rounded-lg bg-muted px-2 py-1 outline-none" />
                <button type="button" onClick={() => { const v = replyText[f.id]?.trim(); if (v) { replyFeedback(f.id, v).then((ok) => { if (ok) { setReplyText({ ...replyText, [f.id]: '' }); toast.success('回复已发送'); } else toast.error('PRTS代理指挥失败。请检查网络再次尝试'); }); } }} className="pressable rounded-lg bg-primary px-3 text-primary-foreground">{t(settings.lang, 'send')}</button>
              </div>
            ) : (
              <div className="mt-2 border-t border-border pt-2">
                <p className="text-success">↳ {f.reply}</p>
                {f.adminRep && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className={
                      "flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-black " +
                      (f.adminRep === "WLLC2026"
                        ? "bg-emerald-400 text-white ring-2 ring-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        : "bg-amber-400/80 text-white ring-2 ring-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.4)]")
                    }>
                      {user?.avatar?.startsWith('data:') ? (
                        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (user?.nickname || user?.username || f.adminRep).slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="font-bold text-foreground">{user?.nickname || f.adminRep}</span>
                    {f.adminRep === "WLLC2026" && <span className="rounded-md bg-emerald-500 px-1 py-0.5 text-[8px] font-black text-white">总管理员</span>}
                    {f.repliedAt && <span>· {new Date(f.repliedAt).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
