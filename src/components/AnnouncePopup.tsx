import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { IAnnouncement } from '@/lib/types';

interface AdminProfile {
  username: string;
  nickname?: string;
  real_name?: string;
  avatar?: string;
}

export default function AnnouncePopup({ announcement }: { announcement: IAnnouncement }) {
  const { markAnnouncementRead, settings, user, savedAccounts } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canClose, setCanClose] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setCanClose(true);
    };
    el.addEventListener('scroll', check);
    const raf = requestAnimationFrame(check);
    return () => {
      el.removeEventListener('scroll', check);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const uid = announcement.authorUid || '00000000';
    // 公告作者资料优先取本地会话（管理员账号不在 users 表里，昵称/头像只存在本地）
    const local = uid === user?.uid
      ? user
      : savedAccounts.find((a) => a.user.uid === uid)?.user;
    if (local) {
      setAdmin({ username: local.username, nickname: local.nickname, real_name: local.realName, avatar: local.avatar });
      return () => { cancelled = true; };
    }
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('username, real_name, avatar')
        .eq('uid', uid)
        .maybeSingle();
      if (!cancelled && data) setAdmin(data as AdminProfile);
    })();
    return () => { cancelled = true; };
  }, [announcement.authorUid, user, savedAccounts]);

  const isOwner = announcement.authorUid === '00000000';
  const adminName = admin?.nickname || admin?.real_name || admin?.username || '管理员';
  const adminAvatar = admin?.avatar || adminName.slice(0, 1);
  const avatarBg = isOwner
    ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950 ring-emerald-400/80 shadow-[0_0_14px_rgba(52,211,153,0.6)]'
    : 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.6)]';
  const badgeCls = isOwner
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-solid w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ maxHeight: '85%' }}>
        <div className="mb-3 flex items-center gap-2.5">
          <div className={'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-black ring-2 ' + avatarBg}>
            {adminAvatar.startsWith('data:') ? (
              <img src={adminAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              adminAvatar
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-black leading-tight">
              <span className="truncate">{adminName}</span>
              <span className={'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ' + badgeCls}>{isOwner ? '总管理员' : '管理员'}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{announcement.date}</div>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">群公告</span>
        </div>
        <h2 className="mb-4 text-center text-lg font-black">{announcement.title}</h2>
        <div
          ref={scrollRef}
          className="dots-bg-fine max-h-[46%] overflow-y-auto rounded-xl bg-muted p-4 text-[15px] leading-relaxed"
        >
          {announcement.imageUrl && (
            <img
              src={announcement.imageUrl}
              alt="公告配图"
              className="mb-3 w-full rounded-lg object-cover"
            />
          )}
          {announcement.body.split('\n').map((line, i) => (
            <p key={i} className="mb-2">
              {line}
            </p>
          ))}
          {announcement.linkUrl && (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-bold text-primary underline"
            >
              🔗 点击查看详情 →
            </a>
          )}
          <p className="pt-2 text-center text-xs text-muted-foreground">—— 到底啦 ——</p>
        </div>
        <button
          type="button"
          disabled={!canClose}
          onClick={() => markAnnouncementRead(announcement.id)}
          className={cn(
            'mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity',
            canClose ? 'bg-primary opacity-100' : 'bg-muted-foreground opacity-40',
          )}
        >
          {t(settings.lang, 'readAll')}
        </button>
      </div>
    </div>
  );
}
