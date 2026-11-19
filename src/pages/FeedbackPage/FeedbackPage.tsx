import { useState } from 'react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SettingsHeader from '@/components/SettingsHeader';

export default function FeedbackPage() {
  const { feedbacks, settings, addFeedback } = useApp();
  const [kind, setKind] = useState<'suggest' | 'complain'>('suggest');
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(true);

  const submit = () => {
    if (!text.trim()) return;
    addFeedback(kind, text.trim(), anon).then((ok) => {
      if (ok) {
        toast.success('提交成功，管理员会尽快查看');
        setText('');
      } else {
        toast.error('PRTS代理指挥失败。请检查网络再次尝试');
      }
    });
  };

  return (
    <div className="flex h-full flex-col p-4">
      <SettingsHeader title={t(settings.lang, 'feedback')} />

      <div className="card-solid space-y-3 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2">
          {(['suggest', 'complain'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-bold',
                kind === k ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {t(settings.lang, k)}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(settings.lang, 'feedbackPlaceholder')}
          className="h-24 w-full rounded-xl bg-muted p-3 text-sm outline-none"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          {t(settings.lang, 'anonymous')}
        </label>
        <button type="button" onClick={submit} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white">
          {t(settings.lang, 'submit')}
        </button>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-black">{t(settings.lang, 'myFeedback')}</h3>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {feedbacks.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">—</p>}
        {feedbacks.map((f) => (
          <div key={f.id} className="card-solid rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">{t(settings.lang, f.kind)}</span>
              <span className={f.status === 'replied' ? 'text-success' : 'text-warning'}>
                {t(settings.lang, f.status)}
              </span>
            </div>
            <p className="mt-1 text-sm">{f.text}</p>
            {f.reply && <p className="mt-1 border-l-2 border-primary pl-2 text-xs text-success">↳ {f.reply}</p>}
          </div>
        ))}
        <div className="mt-4 rounded-xl bg-card p-3 text-center text-xs leading-relaxed text-muted-foreground">
          如果有不方便沟通的事可以联系总管理！<br/>3352360189
        </div>
      </div>
    </div>
  );
}
