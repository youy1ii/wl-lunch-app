import { useEffect, useRef, useState } from 'react';
import { X, Send, Pin, Megaphone, MoreVertical, Users, UserX, ShieldOff, AtSign, Volume2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn, fmtBJT, parseServerDate } from '@/lib/utils';

interface AdminMessage {
  id: number;
  author_uid: string;
  author_name: string;
  text: string;
  kind: string;
  pinned: boolean;
  created_at: string;
}

interface AdminMember {
  uid: string;
  username: string;
  nickname?: string;
  real_name: string;
  role: string;
  avatar?: string;
}

const OWNER_UID = '00000000';

// 群聊头像：支持自定义图片 / emoji / 首字，总管理员用薄荷绿描边泛光
function AuthorAvatar({ name, avatar, isOwner, size = 'sm' }: { name: string; avatar?: string; isOwner: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs';
  const ring = isOwner
    ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-background shadow-[0_0_10px_rgba(52,211,153,0.45)]'
    : 'bg-amber-500/80 text-white ring-2 ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]';
  return (
    <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black', dim, ring)}>
      {avatar?.startsWith('data:') ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        avatar || name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

export default function AdminGroupChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAdmin, settings, notifyGroup, setHideBottomNav } = useApp();
  const lang = settings.lang;
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [manageTarget, setManageTarget] = useState<AdminMember | null>(null);
  const [showAnnounceInput, setShowAnnounceInput] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOwner = user?.uid === OWNER_UID || user?.username === 'WLLC2026';
  // 每次打开群聊只显示本次打开后新收到的消息：记录打开时刻，关闭时清零。
  const sessionStartRef = useRef<number>(0);

  // 群聊里的名字/头像是实时资料，不用消息发送时的快照（否则改了昵称头像后历史消息不同步）
  function resolveAuthor(uid: string, fallbackName: string) {
    if (uid === user?.uid) {
      return { name: user.nickname || user.realName || user.username || fallbackName, avatar: user.avatar };
    }
    const m = members.find((x) => x.uid === uid);
    if (m) return { name: m.nickname || m.real_name || m.username || fallbackName, avatar: m.avatar };
    return { name: fallbackName, avatar: undefined };
  }

  useEffect(() => {
    if (!open || !isAdmin) return;
    setHideBottomNav(true); // 群聊打开时隐藏底栏，避免遮挡输入框
    // 每次打开都是全新的聊天窗口：以打开时刻为界，只显示之后的新消息。
    sessionStartRef.current = Date.now();
    setMessages([]);
    load();
    loadMembers();
    const ch = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); sessionStartRef.current = 0; setHideBottomNav(false); };
  }, [open, isAdmin, setHideBottomNav]);

  async function load() {
    // 只取群聊相关的 kind。app_ 前缀是全局共享数据总线（反馈/通知/公告等），不进群聊。
    const { data } = await supabase
      .from('admin_messages')
      .select('*')
      .in('kind', ['message', 'announcement', 'mention', 'activity'])
      .order('created_at', { ascending: true });
    if (!data) return;
    const start = sessionStartRef.current;
    // 打开时刻之前的历史一律不显示（含置顶公告），实现"每次打开清空"。
    const fresh = start
      ? (data as AdminMessage[]).filter((m) => parseServerDate(m.created_at).getTime() >= start - 1000)
      : [];
    setMessages(fresh);
  }

  async function loadMembers() {
    // 系统里管理员的 role 是 teacher，历史数据里也有 admin，两者都要取
    const { data } = await supabase
      .from('users')
      .select('uid, username, real_name, role, avatar')
      .in('role', ['admin', 'teacher'])
      .order('uid');
    if (data) setMembers(data as AdminMember[]);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from('admin_messages').insert({
      author_uid: user.uid,
      author_name: user.nickname || user.realName || user.username,
      text,
      kind: 'message',
    });
    setDraft('');
    setSending(false);
    if (!error) {
      // 所有管理员都能发言，发言后通知群里其他人
      void notifyGroup(`${user.nickname || user.realName || user.username}：${text}`, user.uid);
    }
    load();
  }

  async function sendAnnounce() {
    const text = announceText.trim();
    if (!text || !user) return;
    await supabase.from('admin_messages').insert({
      author_uid: user.uid,
      author_name: user.nickname || user.realName || user.username,
      text,
      kind: 'announcement',
      pinned: true,
    });
    setAnnounceText('');
    setShowAnnounceInput(false);
    load();
  }

  async function togglePin(id: number, current: boolean) {
    await supabase.from('admin_messages').update({ pinned: !current }).eq('id', id);
    load();
  }

  async function banMember(target: AdminMember) {
    if (!confirm(`确定要封禁 ${target.username} 吗？封禁后该账号无法登录。`)) return;
    await supabase.from('users').update({ role: 'banned' }).eq('uid', target.uid);
    setManageTarget(null);
    loadMembers();
  }

  async function removeAdmin(target: AdminMember) {
    if (!confirm(`确定要取消 ${target.username} 的管理员权限吗？`)) return;
    await supabase.from('users').update({ role: 'student' }).eq('uid', target.uid);
    setManageTarget(null);
    loadMembers();
  }

  async function notifyMember(target: AdminMember) {
    // Send a system message @mentioning
    if (!user) return;
    await supabase.from('admin_messages').insert({
      author_uid: user.uid,
      author_name: user.nickname || user.realName || user.username,
      text: `@${target.username} 请查看此消息`,
      kind: 'mention',
    });
    setManageTarget(null);
    load();
  }

  if (!open) return null;

  const pinned = messages.filter((m) => m.pinned);
  const normal = messages.filter((m) => !m.pinned);
  const ownerMember = members.find((m) => m.uid === OWNER_UID);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="anim-rise relative flex h-[78dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'color-mix(in oklab, var(--border) 50%, transparent)' }}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Megaphone size={18} />
            </div>
            <div>
              <div className="text-sm font-black">管理员群</div>
              <div className="text-[10px] text-muted-foreground">
                群主: {ownerMember?.nickname || ownerMember?.real_name || ownerMember?.username || 'WLLC2026'} · {members.length}人
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAnnounceInput(!showAnnounceInput)}
                className="pressable flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                title="发布群公告"
              >
                <Megaphone size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className="pressable flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              title="群成员"
            >
              <MoreVertical size={18} />
            </button>
            <button type="button" onClick={onClose} className="pressable flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Announce input */}
        {showAnnounceInput && isOwner && (
          <div className="border-b p-3" style={{ borderColor: 'color-mix(in oklab, var(--border) 50%, transparent)', background: 'color-mix(in oklab, var(--primary) 8%, transparent)' }}>
            <div className="mb-2 text-xs font-bold text-primary">📢 发布群公告（将置顶）</div>
            <textarea
              value={announceText}
              onChange={(e) => setAnnounceText(e.target.value)}
              rows={2}
              placeholder="输入群公告内容..."
              className="mb-2 w-full rounded-xl bg-muted p-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAnnounceInput(false)} className="pressable flex-1 rounded-full bg-muted py-1.5 text-xs font-bold text-muted-foreground">取消</button>
              <button type="button" onClick={sendAnnounce} disabled={!announceText.trim()} className="pressable flex-1 rounded-full bg-primary py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40">发布</button>
            </div>
          </div>
        )}

        {/* Pinned banner */}
        {pinned.length > 0 && (
          <div className="border-b px-4 py-2" style={{ background: 'color-mix(in oklab, var(--primary) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--border) 50%, transparent)' }}>
            {pinned.map((m) => (
              <div key={m.id} className="flex items-start gap-1.5 text-xs">
                <Pin size={12} className="mt-0.5 shrink-0 text-primary" />
                <div className="flex-1">
                  <span className="font-bold">{resolveAuthor(m.author_uid, m.author_name).name}：</span>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Members panel (overlay) */}
        {showMembers && (
          <div className="absolute inset-x-0 top-[52px] bottom-0 z-10 flex flex-col" style={{ background: 'var(--card)' }}>
            <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'color-mix(in oklab, var(--border) 50%, transparent)' }}>
              <Users size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold">群成员 ({members.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {members.map((m) => (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => { if (isOwner && m.uid !== OWNER_UID) setManageTarget(m); else setShowMembers(false); }}
                  className="pressable flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted"
                >
                  <AuthorAvatar name={m.nickname || m.real_name || m.username} avatar={m.avatar} isOwner={m.uid === OWNER_UID} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-sm font-bold">
                      {m.nickname || m.real_name || m.username}
                      {m.uid === OWNER_UID && <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">总管理员</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">UID: {m.uid}</div>
                  </div>
                  {isOwner && m.uid !== OWNER_UID && <ChevronRightIcon />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
          {normal.length === 0 && pinned.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">暂无消息</div>
          )}
          {normal.map((m) => {
            const mine = m.author_uid === user?.uid;
            const author = resolveAuthor(m.author_uid, m.author_name);
            return (
              <div key={m.id} className={cn('mb-3 flex gap-2', mine && 'flex-row-reverse')}>
                <button
                  type="button"
                  onClick={() => {
                    const target = members.find((mm) => mm.uid === m.author_uid);
                    if (isOwner && target && m.author_uid !== OWNER_UID) setManageTarget(target);
                  }}
                >
                  <AuthorAvatar name={author.name} avatar={author.avatar} isOwner={m.author_uid === OWNER_UID} />
                </button>
                <div className={cn('max-w-[75%]', mine && 'text-right')}>
                  <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground" style={{ justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <span className="font-bold" style={{ color: m.author_uid === OWNER_UID ? 'var(--primary)' : undefined }}>
                      {author.name}
                      {m.author_uid === OWNER_UID && <span className="ml-1 rounded-md bg-emerald-500 px-1 py-0.5 text-[8px] font-black text-white">总管理员</span>}
                    </span>
                    <span>{fmtBJT(m.created_at)}</span>
                    {isOwner && m.author_uid !== OWNER_UID && (
                      <button
                        type="button"
                        onClick={() => togglePin(m.id, m.pinned)}
                        className="pressable flex items-center gap-0.5 text-primary hover:underline"
                      >
                        <Pin size={10} /> {m.pinned ? '取消置顶' : '置顶'}
                      </button>
                    )}
                  </div>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t p-3" style={{ borderColor: 'color-mix(in oklab, var(--border) 50%, transparent)' }}>
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="发送管理员消息..."
              className="flex-1 rounded-full bg-muted px-4 py-2 text-base outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Manage member popup */}
        {manageTarget && (
          <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40" onClick={() => setManageTarget(null)}>
            <div
              className="anim-rise w-full rounded-t-3xl p-4" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", background: 'var(--card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-black">
                  {manageTarget.avatar?.startsWith('data:') ? (
                    <img src={manageTarget.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    manageTarget.avatar || (manageTarget.nickname || manageTarget.real_name || manageTarget.username).slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-sm font-black">{manageTarget.nickname || manageTarget.real_name || manageTarget.username}</div>
                  <div className="text-[10px] text-muted-foreground">UID: {manageTarget.uid}</div>
                </div>
              </div>
              <button type="button" onClick={() => notifyMember(manageTarget)} className="pressable mb-2 flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left text-sm">
                <Volume2 size={16} className="text-primary" /> @提示该成员
              </button>
              <button type="button" onClick={() => removeAdmin(manageTarget)} className="pressable mb-2 flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left text-sm">
                <ShieldOff size={16} className="text-amber-500" /> 取消管理员
              </button>
              <button type="button" onClick={() => banMember(manageTarget)} className="pressable flex w-full items-center gap-3 rounded-xl bg-destructive/10 p-3 text-left text-sm text-destructive">
                <UserX size={16} /> 封禁账号
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
