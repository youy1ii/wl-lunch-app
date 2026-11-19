import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Send, MessageCircle, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import type { IFeedback } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn, isOwnerMark, isOwnerUser, fmtBJT, sameBJTDay } from '@/lib/utils';
import { toast } from 'sonner';

interface Conversation {
  key: string;
  name: string;
  uid?: string;
  realName?: string;
  anonymous: boolean;
  items: IFeedback[];
  pending: number;
  lastAt?: string;
  lastText: string;
}

function fmtTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // 统一北京时间：今天只显示时分，否则显示月-日 时分
  return fmtBJT(d, !sameBJTDay(d, new Date()));
}

// 总管理员头像固定薄荷绿 + 泛光，不受上传头像影响
const OWNER_AVATAR_CLS = 'bg-emerald-400 text-white glow-mint';

function Avatar({ name, admin }: { name: string; admin?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-black',
        admin ? OWNER_AVATAR_CLS : 'bg-amber-400/90 text-white ring-2 ring-amber-300',
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function FeedbackInboxPage() {
  const { feedbacks, replyFeedback, settings, user, setHideBottomNav } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'pending' | 'replied'>('all');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState<number | null>(null);

  const lang = settings.lang;

  // 每条反馈独立成一个会话窗口：一条建议/投诉 = 一行，点进去只有这一条和它的回复。
  const conversations = useMemo(() => {
    const list: Conversation[] = feedbacks.map((f) => ({
      key: `fb-${f.id}`,
      name: f.anonymous ? t(lang, 'anonymous') : (f.authorRealName || f.author || t(lang, '同学')),
      uid: f.authorUid,
      realName: f.authorRealName,
      anonymous: f.anonymous,
      items: [f],
      pending: f.status === 'pending' ? 1 : 0,
      lastAt: f.repliedAt || f.createdAt,
      lastText: f.status === 'replied' ? `↳ ${f.reply || ''}` : (f.text || ''),
    }));
    list.sort((a, b) =>
      new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime(),
    );
    return list;
  }, [feedbacks, lang]);

  const visible = conversations.filter((c) =>
    tab === 'all' || (tab === 'pending' ? c.pending > 0 : c.pending === 0),
  );
  const active = conversations.find((c) => c.key === activeKey) || null;

  // 进入聊天会话时隐藏底部导航（像微信聊天页），让输入框贴底；离开时恢复。
  useEffect(() => {
    setHideBottomNav(!!activeKey);
    return () => setHideBottomNav(false);
  }, [activeKey, setHideBottomNav]);

  const pendingItems = active?.items.filter((f) => f.status === 'pending') || [];
  const currentTarget = replyTarget && pendingItems.some((f) => f.id === replyTarget)
    ? replyTarget
    : pendingItems[0]?.id ?? null;

  const doReply = () => {
    const v = replyText.trim();
    if (!v || currentTarget === null) return;
    replyFeedback(currentTarget, v).then((ok) => {
      if (ok) {
        setReplyText('');
        setReplyTarget(null);
        toast.success(t(lang, 'reply') + ' ✓');
      } else {
        toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
      }
    });
  };

  // ---------- 聊天窗视图 ----------
  if (active) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 shadow-sm">
          <button type="button" onClick={() => { setActiveKey(null); setReplyTarget(null); setReplyText(''); }} className="pressable rounded-full p-1.5">
            <ChevronLeft size={20} />
          </button>
          <Avatar name={active.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">{active.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {active.anonymous ? t(lang, 'anonymous') : (active.uid ? `UID:${active.uid}` : '')}
              {active.realName ? ` · ${active.realName}` : ''}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {active.items.map((f) => {
            const isMine = f.status === 'replied';
            const selected = !isMine && f.id === currentTarget;
            return (
              <div key={f.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Avatar name={active.name} />
                  <div className="max-w-[75%]">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-bold">{active.name}</span>
                      <span>{fmtTime(f.createdAt)}</span>
                      <span className={cn('rounded px-1 py-0.5 text-[10px] font-bold',
                        f.kind === 'complain' ? 'bg-red-500/20 text-red-600' : 'bg-blue-500/20 text-blue-600')}>
                        {f.kind === 'complain' ? t(lang, 'complain') : t(lang, 'suggest')}
                      </span>
                      {f.status === 'pending' && (
                        <span className="rounded bg-destructive/20 px-1 py-0.5 text-[10px] font-bold text-destructive">
                          {t(lang, 'pending')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isMine}
                      onClick={() => { if (!isMine) { setReplyTarget(f.id); setReplyText(''); } }}
                      className={cn(
                        'block rounded-2xl rounded-tl-sm px-3 py-2 text-left text-sm shadow-sm',
                        selected ? 'bg-primary/25 ring-2 ring-primary' : 'bg-card',
                      )}
                    >
                      {f.text}
                    </button>
                  </div>
                </div>
                {f.status === 'replied' && f.reply && (
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[75%]">
                      <div className="mb-0.5 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                        {f.repliedAt && <span>{fmtTime(f.repliedAt)}</span>}
                        <span className="font-bold" style={{ color: isOwnerMark(f.adminRep) ? 'var(--primary)' : undefined }}>{user?.nickname || f.adminRep || t(lang,'管理员')}</span>
                        {isOwnerMark(f.adminRep) && <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white">{t(lang,'总管理员')}</span>}
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-left text-sm text-primary-foreground shadow-sm">
                        {f.reply}
                      </div>
                    </div>
                    <Avatar name={(user?.nickname || f.adminRep || '管').slice(0, 1)} admin={isOwnerMark(f.adminRep) || isOwnerUser(user)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pendingItems.length > 0 ? (
          <div className="border-t border-border bg-card px-3 py-2.5">
            <div className="mb-1.5 truncate text-xs text-muted-foreground">
              {t(lang, 'reply')} → {active.items.find((x) => x.id === currentTarget)?.text.slice(0, 24) || ''}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doReply(); }}
                placeholder={t(lang, 'replyPlaceholder')}
                className="flex-1 rounded-full bg-muted px-4 py-2.5 text-base outline-none"
              />
              <button
                type="button"
                onClick={doReply}
                disabled={!replyText.trim()}
                className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border bg-card px-3 py-4 text-center text-xs font-bold text-success">
            {t(lang, 'noFeedback')}
          </div>
        )}
      </div>
    );
  }

  // ---------- 会话列表视图 ----------
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button type="button" onClick={() => navigate(-1)} className="pressable rounded-full p-1.5">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black">📬 {t(lang, 'feedbackInbox')}（{conversations.length}）</h1>
      </div>

      <div className="mx-3 mt-3 flex gap-2">
        {(['all', 'pending', 'replied'] as const).map((name) => (
          <button key={name} type="button" onClick={() => setTab(name)}
            className={cn('flex-1 rounded-xl py-2 text-sm font-bold', tab === name ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            {t(lang, name)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Inbox size={40} strokeWidth={1.5} />
            <p className="text-sm font-bold">{t(lang, 'noFeedback')}</p>
          </div>
        )}
        {visible.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setActiveKey(c.key); setReplyTarget(null); setReplyText(''); }}
            className="pressable flex w-full items-center gap-3.5 border-b border-border/60 px-4 py-4 text-left"
          >
            <div className="relative">
              <Avatar name={c.name} />
              {c.pending > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground">
                  {c.pending}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-base font-black">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtTime(c.lastAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-muted-foreground">{c.lastText}</span>
                <MessageCircle size={15} className="shrink-0 text-muted-foreground" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
