import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppStore, type AppStoreValue } from '@/lib/store-context';
import { MOCK_ANNOUNCEMENTS, MOCK_BANNERS, encodeTier, decodeTier } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import type {
  IBanner,
  IDish,
  IFeedback,
  IAnnouncement,
  INotification,
  ISettings,
  IUser,
  IAvatarFrame,
} from '@/lib/types';

const ADMIN_ACCOUNT = 'WLLC2026';
const ADMIN_PASSWORD = 'iloveWL';
const NS = 'wl-lunch';

/* 已处理反馈保留 30 天，到期自动删除。
   不用常驻定时器（会占运行内存）：每次 loadAll 顺带判断，localStorage 节流一天最多清一次库。 */
const FEEDBACK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function isExpiredFeedback(r: any): boolean {
  if (r.status !== 'replied') return false;
  const stamp = r.replied_at || r.created_at;
  if (!stamp) return false;
  const t = new Date(stamp).getTime();
  return Number.isFinite(t) && Date.now() - t > FEEDBACK_TTL_MS;
}

function shouldSweepFeedback(): boolean {
  try {
    const last = Number(localStorage.getItem(`${NS}:fb-sweep`) || 0);
    return Date.now() - last > SWEEP_INTERVAL_MS;
  } catch { return true; }
}
function markFeedbackSwept() {
  try { localStorage.setItem(`${NS}:fb-sweep`, String(Date.now())); } catch {}
}

/* ============================================================
   共享数据架构
   ------------------------------------------------------------
   规范表（你已建好，带唯一约束 + Realtime publication）：
     feedbacks / notifications / announcements / banners
     follows / rating_likes / rating_replies / avatar_frames
   admin_messages 只承载：
     管理员群聊 + 没有独立表的少量数据
     （滚动通知 app_ticker / 赞赏码 app_tips / 个人展示偏好 app_pref / 菜品上线日 app_launch）
   ============================================================ */
const BUS = 'admin_messages';
const K = {
  TICKER: 'app_ticker',
  TIPS: 'app_tips',
  PREF: 'app_pref',
  LAUNCH: 'app_launch',
} as const;

type BusRow = {
  id: number;
  created_at: string;
  author_uid: string;
  author_name: string;
  text: string;
  kind: string;
  pinned: boolean | null;
};

// 把数据库里存的本站完整外链转成同源相对路径，避免子路径部署下外链加载超时导致 banner 空白。
function normalizeBannerImage(raw: any): string | undefined {
  if (!raw) return undefined;
  const url = String(raw);
  const m = url.match(/\/wl-lunch-app\/([^/?#]+\.(?:png|jpe?g|webp|gif))(?:\?|#|$)/i);
  if (m) return `${import.meta.env.BASE_URL}${m[1]}`;
  return url;
}

const jparse = (s?: string | null): any => {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
};
const jstr = (o: any): string => JSON.stringify(o ?? {});

function loadSession(): { user: IUser | null; isAdmin: boolean; readIds: number[] } {
  try {
    const raw = localStorage.getItem(`${NS}:session`);
    if (!raw) return { user: null, isAdmin: false, readIds: [] };
    const s = JSON.parse(raw);
    return { user: s.user ?? null, isAdmin: !!s.isAdmin, readIds: s.readIds ?? [] };
  } catch {
    return { user: null, isAdmin: false, readIds: [] };
  }
}

function saveAccountToList(u: IUser, isAdmin: boolean) {
  try {
    const raw = localStorage.getItem('wl-lunch:accounts');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((a) => a.user.uid === u.uid);
    const entry = { user: u, isAdmin };
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    localStorage.setItem('wl-lunch:accounts', JSON.stringify(list.slice(0, 10)));
  } catch {}
}
function getAccountList(): { user: IUser; isAdmin: boolean }[] {
  try { return JSON.parse(localStorage.getItem('wl-lunch:accounts') || '[]'); } catch { return []; }
}

function saveSession(user: IUser | null, isAdmin: boolean, readIds: number[]) {
  try {
    if (!user) localStorage.removeItem(`${NS}:session`);
    else localStorage.setItem(`${NS}:session`, JSON.stringify({ user, isAdmin, readIds }));
  } catch {}
}

function loadSettings(): ISettings {
  const fb: ISettings = {
    lang: 'zh', accent: '#E8B923', bgColor: '', textColor: '', bgImage: null, bgBlur: 0,
    frosted: true, opacity: 0.82, parallax: true, haptics: true, pageAnim: true, font: null,
  };
  try {
    const raw = localStorage.getItem(`${NS}:settings`);
    return raw ? { ...fb, ...(JSON.parse(raw) as Partial<ISettings>) } : fb;
  } catch { return fb; }
}

export default function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(loadSession);
  const [user, setUser] = useState<IUser | null>(initial.user);
  const [followees, setFollowees] = useState<string[]>([]);
  const [frames, setFrames] = useState<IAvatarFrame[]>([]);
  const [myFrameId, setMyFrameId] = useState<string>('');
  const [profileHeader, setProfileHeader] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(initial.isAdmin);
  const [pendingLoginName, setPendingLoginName] = useState<string>('');
  const [dishes, setDishes] = useState<IDish[]>([]);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>(MOCK_ANNOUNCEMENTS);
  const [banners, setBannersState] = useState<IBanner[]>(MOCK_BANNERS);
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [tipsQr, setTipsQrState] = useState<string | null>(`${import.meta.env.BASE_URL}tip.jpg`);
  const [settings, setSettingsState] = useState<ISettings>(loadSettings);
  const [readIds, setReadIds] = useState<number[]>(initial.readIds);
  const [ticker, setTickerState] = useState('欢迎各位参与内测!');
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [wants, setWantsState] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('wl-lunch:wants') || '[]'); } catch { return []; } });
  const toggleWant = useCallback((id: number) => {
    setWantsState((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('wl-lunch:wants', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  // 按 uid 索引的最新用户资料（昵称/头像/签名），供评论区与跨设备同步使用
  const [userProfiles, setUserProfiles] = useState<Record<string, IUser>>({});
  const getProfile = useCallback((uid?: string): IUser | undefined => {
    if (!uid) return undefined;
    if (uid === user?.uid && user) return user; // 自己的资料直接用实时 state
    return userProfiles[uid];
  }, [user, userProfiles]);

  const setSettings = useCallback((patch: Partial<ISettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(`${NS}:settings`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ---------------- 登录 / 账号（注册流程按要求不改） ---------------- */
  const loginWithPhone = useCallback((phone: string) => {
    if (!/^\d{6,11}$/.test(phone)) return { bad: '手机号不对' };
    setPendingLoginName('同学');
    return { needProfile: true };
  }, []);

  const loginWithWechat = useCallback(() => {
    setPendingLoginName('微信同学');
    return { needProfile: true };
  }, []);

  const loginWithAccountPwd = useCallback((account: string, pwd: string) => {
    if (account === ADMIN_ACCOUNT && pwd === ADMIN_PASSWORD) {
      return new Promise<{ needProfile?: boolean; admin?: boolean; bad?: string }>((resolve) => {
        supabase.from('users').select('*').eq('username', 'WLLC2026').then(({ data }) => {
          let u: IUser;
          if (data && data.length > 0) {
            const row = data[0] as any;
            u = {
              uid: row.uid || '00000000', username: row.username || 'WLLC2026',
              realName: row.real_name || 'WLLC2026', role: 'teacher',
              bio: row.bio || '', avatar: row.avatar || '', nickname: row.nickname || row.real_name || 'WLLC2026', showRealInfo: true,
            } as any;
          } else {
            u = { uid: '00000000', username: 'WLLC2026', realName: 'WLLC2026', role: 'teacher', bio: '', avatar: '', nickname: 'WLLC2026', showRealInfo: true } as any;
          }
          setIsAdmin(true);
          setUser(u);
          saveSession(u, true, readIds);
          saveAccountToList(u, true);
          resolve({ admin: true });
        });
      });
    }
    return new Promise<{ needProfile?: boolean; admin?: boolean; bad?: string }>((resolve) => {
      supabase.from('users').select('*').eq('username', account).then(({ data }) => {
        if (data && data.length > 0) {
          const row = data[0] as any;
          if (row.role === 'banned') { resolve({ bad: '该账号已被封禁，无法登录' }); return; }
          if (row.password && row.password !== pwd) { resolve({ bad: '密码不对' }); return; }
          const u: IUser = {
            uid: row.uid, username: row.username, realName: row.real_name || row.username,
            role: row.role || 'student', studentId: row.student_id, klass: row.klass,
            grade: row.grade, bio: row.bio, avatar: row.avatar,
            nickname: row.nickname || row.real_name || row.username, showRealInfo: false,
          } as any;
          setUser(u);
          const isT = row.role === 'teacher';
          setIsAdmin(isT);
          saveSession(u, isT, readIds);
          saveAccountToList(u, isT);
          resolve({});
        } else {
          setPendingLoginName(account || '同学');
          resolve({ needProfile: true });
        }
      });
    });
  }, [readIds]);

  const completeProfile = useCallback((u: IUser) => {
    if (!u.uid) u.uid = String(Math.floor(10000000 + Math.random() * 90000000));
    setUser(u);
    setPendingLoginName('');
    saveSession(u, false, readIds);
    supabase.from('users').upsert({
      uid: u.uid, username: u.username, real_name: u.realName, role: u.role,
      student_id: u.studentId, klass: u.klass, grade: u.grade,
    }).then(() => {});
  }, [readIds]);

  const logout = useCallback(() => {
    setUser(null); setIsAdmin(false); saveSession(null, false, []);
  }, []);

  const switchAccount = useCallback((uid: string) => {
    const entry = getAccountList().find((a) => a.user.uid === uid);
    if (!entry) return;
    setUser(entry.user); setIsAdmin(entry.isAdmin);
    saveSession(entry.user, entry.isAdmin, readIds);
  }, [readIds]);

  const savedAccounts = getAccountList();

  /* ---------------- 共享数据：并行拉取所有表 ---------------- */
  const buildDishes = useCallback((
    dishRows: any[], ratingRows: any[], meUid?: string,
    likeRows: any[] = [], replyRows: any[] = [], launchMap: Record<number, string> = {},
  ) => {
    return dishRows.map((d: any) => {
      const counts = [0, 0, 0, 0, 0];
      const reviews: any[] = [];
      let earliest: string | undefined;
      ratingRows.forEach((r: any) => {
        if (r.dish_id !== d.id) return;
        if (r.created_at && (!earliest || r.created_at < earliest)) earliest = r.created_at;
        const score = decodeTier(r.tier); // 库里 integer：>5 是 ×10 编码的小数分，1~5 是历史整数分
        const bucket = Math.max(0, Math.min(4, Math.round(score) - 1)); // 分布统计按最近整数档归档
        counts[bucket] = (counts[bucket] || 0) + 1;
        if (r.text && r.text.trim()) {
          reviews.push({
            id: r.id, author: r.author_name || '同学', tier: score, text: r.text,
            likes: 0, liked: false, replies: [],
            mine: meUid ? r.user_uid === meUid : false,
            authorUid: r.user_uid || undefined, createdAt: r.created_at,
          });
        }
      });
      // 共享点赞 / 楼中楼
      reviews.forEach((rv) => {
        const ls = likeRows.filter((p) => String(p.rating_id) === String(rv.id));
        rv.likes = ls.length;
        rv.liked = meUid ? ls.some((p) => p.user_uid === meUid) : false;
        rv.replies = replyRows
          .filter((p) => String(p.rating_id) === String(rv.id))
          .map((p) => ({ id: Number(p.id), author: p.author_name || '同学', text: p.text || '' }))
          .sort((a, b) => a.id - b.id);
      });
      reviews.sort((a, b) => b.likes - a.likes);
      let launchDate: string | undefined = earliest ? earliest.slice(0, 10) : undefined;
      if (!launchDate) launchDate = launchMap[d.id];
      if (!launchDate) {
        try { const map = JSON.parse(localStorage.getItem('wl-lunch:dish-launch') || '{}'); launchDate = map[d.id]; } catch {}
      }
      return {
        id: d.id, name: d.name, price: d.price, windowId: d.dish_window || ('A' as any),
        launchDate, counts, reviews, veggie: d.vegetarian, isNew: d.is_new,
        mealType: d.meal_type, tags: d.tags || [], image: d.image || undefined,
      } as IDish;
    });
  }, []);

  const loadAll = useCallback(async () => {
    const uid = user?.uid || '';
    const isAdminNow = !!(
      user?.username === 'WLLC2026' || user?.uid === '00000000' ||
      user?.role === 'teacher' || isAdmin
    );

    const [busRes, dishRes, ratingRes, fbRes, notifRes, annRes, bannerRes,
      followRes, likeRes, replyRes, frameRes, usersRes] = await Promise.all([
      supabase.from(BUS).select('*'),
      supabase.from('dishes').select('*'),
      supabase.from('ratings').select('*'),
      supabase.from('feedbacks').select('*').order('id', { ascending: false }),
      supabase.from('notifications').select('*').order('id', { ascending: false }),
      supabase.from('announcements').select('*').order('id', { ascending: false }),
      supabase.from('banners').select('*').order('sort_order', { ascending: true }),
      supabase.from('follows').select('*'),
      supabase.from('rating_likes').select('*'),
      supabase.from('rating_replies').select('*').order('id', { ascending: true }),
      supabase.from('avatar_frames').select('*').order('id', { ascending: true }),
      supabase.from('users').select('*'),
    ]);

    const busRows = ((busRes.data || []) as BusRow[]);
    const byKind = (k: string) => busRows.filter((r) => r.kind === k);
    const dishRows = dishRes.data || [];
    const ratingRows = ratingRes.data || [];

    // 菜品 + 共享点赞/回复/上线日期
    const launchMap: Record<number, string> = {};
    byKind(K.LAUNCH).forEach((r) => {
      const p = jparse(r.text);
      if (p.dishId != null && p.date) launchMap[p.dishId] = p.date;
    });
    // 数据库有多少就显示多少，删空后就是真空状态（不再用假数据填充）
    setDishes(buildDishes(dishRows, ratingRows, uid, likeRes.data || [], replyRes.data || [], launchMap));
    const mine: Record<number, number> = {};
    if (uid) ratingRows.forEach((r: any) => { if (r.user_uid === uid) mine[r.dish_id] = decodeTier(r.tier); });
    setMyRatings(mine);

    // 反馈：先本地过滤掉过期的已处理反馈（界面立即不显示），再按节流清理数据库
    if (!fbRes.error) {
      const allFeedback = fbRes.data || [];
      const activeFeedback = allFeedback.filter((r: any) => !isExpiredFeedback(r));
      setFeedbacks(activeFeedback.map((r: any) => ({
        id: Number(r.id), kind: r.kind === 'complain' ? 'complain' : 'suggest',
        text: r.text || '', anonymous: !!r.anonymous,
        status: r.status === 'replied' ? 'replied' : 'pending',
        reply: r.reply || undefined,
        author: r.anonymous ? '匿名' : (r.author_name || '同学'),
        authorUid: r.author_uid || undefined,
        authorRealName: r.anonymous ? '' : (r.author_real_name || ''),
        adminRep: r.admin_rep || undefined, repliedAt: r.replied_at || undefined,
        createdAt: r.created_at || undefined,
      } as IFeedback)));

      // 过期记录真删除：仅在有过期数据时、且距上次清理超过一天才执行。
      // fire-and-forget，不阻塞界面、无常驻定时器、不占运行内存。
      const expiredIds = allFeedback.filter(isExpiredFeedback).map((r: any) => r.id);
      if (expiredIds.length > 0 && shouldSweepFeedback()) {
        markFeedbackSwept();
        supabase.from('feedbacks').delete().in('id', expiredIds).then(() => {});
      }
    }

    // 通知：定向 / 全员广播 / 管理员组
    if (!notifRes.error) {
      setNotifications((notifRes.data || []).filter((r: any) => {
        const t = r.target_uid;
        return !!uid && (t === uid || t === 'ALL' || (isAdminNow && t === '00000000'));
      }).map((r: any) => ({
        id: Number(r.id),
        kind: (['like', 'reply', 'admin', 'feedback'].includes(r.kind) ? r.kind : 'admin') as INotification['kind'],
        text: r.text || '', time: r.created_at, read: !!r.read,
        feedbackText: undefined, replyText: undefined, adminRep: undefined, replyTime: undefined,
      } as INotification)));
    }

    // 公告
    if (!annRes.error && (annRes.data || []).length > 0) {
      setAnnouncements((annRes.data || []).map((r: any) => ({
        id: Number(r.id), title: r.title || '', body: r.body || '',
        date: (r.created_at || '').slice(0, 10), imageUrl: r.image_url || undefined,
        linkUrl: r.link_url || undefined, authorUid: r.author_uid || undefined,
        authorName: r.author_name || undefined, pinned: !!r.pinned,
      } as IAnnouncement & { authorName?: string })));
    }

    // Banner
    if (!bannerRes.error) {
      setBannersState((bannerRes.data || []).map((r: any) => ({
        id: Number(r.id), title: r.title || '', target: r.link_url || '',
        image: normalizeBannerImage(r.image_url),
      } as IBanner)));
    }

    // 头像框
    if (!frameRes.error) {
      setFrames((frameRes.data || []).map((r: any) => ({
        id: String(r.id), name: r.name || '', imageUrl: r.image_url || '',
        unlockText: r.description || '', issuedTo: Array.isArray(r.issued_to) ? r.issued_to : [],
        code: r.code || undefined, maxClaims: r.max_claims ?? undefined,
        expiresAt: r.expires_at || undefined,
      } as IAvatarFrame)));
    }

    // 关注
    setFollowees(uid && !followRes.error
      ? (followRes.data || []).filter((r: any) => r.follower_uid === uid).map((r: any) => r.followee_name).filter(Boolean)
      : []);

    // 滚动通知 / 赞赏码 / 个人偏好（无独立表，继续用 admin_messages）
    const tickerRow = byKind(K.TICKER)[0];
    if (tickerRow) {
      const p = jparse(tickerRow.text);
      if (typeof p.text === 'string') setTickerState(p.text);
    }
    const tipsRow = byKind(K.TIPS)[0];
    if (tipsRow) {
      const p = jparse(tipsRow.text);
      setTipsQrState(typeof p.qr === 'string' && p.qr ? p.qr : null);
    }
    // 每个用户的 app_pref 偏好（昵称存这里，users 表无 nickname 列）
    const prefByUid: Record<string, any> = {};
    byKind(K.PREF).forEach((r) => { if (r.author_uid) prefByUid[r.author_uid] = jparse(r.text); });
    // 构建 uid → 最新资料映射：users 表提供账号名/真名/头像/签名，app_pref 提供昵称
    const profiles: Record<string, IUser> = {};
    if (!usersRes.error) {
      (usersRes.data || []).forEach((row: any) => {
        const pref = prefByUid[row.uid] || {};
        profiles[row.uid] = {
          uid: row.uid, username: row.username || '', realName: row.real_name || row.username || '',
          role: row.role || 'student', studentId: row.student_id, klass: row.klass, grade: row.grade,
          bio: row.bio || '', avatar: row.avatar || '',
          nickname: typeof pref.nickname === 'string' ? pref.nickname : (row.real_name || row.username || ''),
          showRealInfo: !!row.show_real_info,
        } as IUser;
      });
    }
    setUserProfiles(profiles);

    const prefRow = uid ? byKind(K.PREF).find((r) => r.author_uid === uid) : undefined;
    if (prefRow) {
      const p = jparse(prefRow.text);
      setMyFrameId(p.myFrameId || ''); setProfileHeader(p.profileHeader || '');
    }
    // 以服务端资料为准刷新当前用户（跨设备昵称/签名/头像同步）：
    // users 表无 nickname 列，昵称只能取自 app_pref；没有偏好记录时回退服务端真名/账号名。
    if (uid && profiles[uid]) {
      const latest = profiles[uid];
      setUser((prev) => {
        if (!prev) return prev;
        const next: IUser = {
          ...prev,
          username: latest.username || prev.username,
          realName: latest.realName || prev.realName,
          bio: latest.bio,
          avatar: latest.avatar,
          nickname: prefByUid[uid] && typeof prefByUid[uid].nickname === 'string'
            ? prefByUid[uid].nickname : (latest.realName || latest.username || prev.nickname),
        };
        // 无实质变化则不更新，避免不必要的重渲染/realtime 回环
        const same = next.username === prev.username && next.realName === prev.realName
          && next.bio === prev.bio && next.avatar === prev.avatar && next.nickname === prev.nickname;
        return same ? prev : next;
      });
    }
  // 资料由本函数刷新，setUser 里用 same 短路避免 username/role 变化触发的回环
  }, [user?.uid, user?.username, user?.role, isAdmin, buildDishes]);

  /* ---------------- 写入助手 ---------------- */
  const notify = useCallback(async (
    targets: string[], nkind: INotification['kind'], text: string,
  ): Promise<boolean> => {
    const list = [...new Set(targets.filter(Boolean))];
    if (!list.length) return false;
    const { error } = await supabase.from('notifications').insert(list.map((t) => ({
      target_uid: t, kind: nkind, text, read: false,
    })));
    if (!error) loadAll();
    return !error;
  }, [loadAll]);

  const adminTargets = useCallback(async (): Promise<string[]> => {
    const { data } = await supabase.from('users').select('uid').in('role', ['teacher', 'admin']);
    return [...new Set(['00000000', ...(data || []).map((r: any) => r.uid).filter(Boolean)])];
  }, []);

  // 群聊发言通知：推给除发信人外的所有管理员
  const notifyGroup = useCallback(async (text: string, excludeUid?: string): Promise<boolean> => {
    const targets = (await adminTargets()).filter((uid) => uid !== excludeUid);
    if (!targets.length) return false;
    return notify(targets, 'admin', `💬 管理员群：${text.slice(0, 40)}`);
  }, [adminTargets, notify]);

  const upsertPref = useCallback(async (patch: Record<string, any>) => {
    if (!user?.uid) return;
    const { data } = await supabase.from(BUS).select('id,text').eq('kind', K.PREF).eq('author_uid', user.uid).maybeSingle();
    const res = data
      ? await supabase.from(BUS).update({ text: jstr({ ...jparse(data.text), ...patch }) }).eq('id', data.id)
      : await supabase.from(BUS).insert({ kind: K.PREF, author_uid: user.uid, author_name: user.username || '', text: jstr(patch) });
    if (!res.error) loadAll();
  }, [user, loadAll]);

  const upsertSingleton = useCallback(async (kind: string, payload: any): Promise<boolean> => {
    const { data } = await supabase.from(BUS).select('id').eq('kind', kind).order('id', { ascending: true }).limit(1).maybeSingle();
    const res = data
      ? await supabase.from(BUS).update({ text: jstr(payload) }).eq('id', data.id)
      : await supabase.from(BUS).insert({ kind, author_uid: user?.uid || '00000000', author_name: user?.username || 'system', text: jstr(payload) });
    if (!res.error) loadAll();
    return !res.error;
  }, [user, loadAll]);

  // 初始加载 + 实时订阅（每张表独立 channel，避免 publication 差异连累其它订阅）
  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const tables = [
      'admin_messages', 'dishes', 'ratings', 'feedbacks', 'notifications',
      'announcements', 'banners', 'follows', 'rating_likes', 'rating_replies', 'avatar_frames', 'users',
    ];
    const channels = tables.map((tbl) =>
      supabase.channel(`rt-${tbl}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => {
          if (tbl === 'users') {
            if (!user?.uid) return;
            supabase.from('users').select('*').eq('uid', user.uid).then(({ data }) => {
              if (data && data.length > 0) {
                const row = data[0] as any;
                setUser((prev) => prev ? {
                  ...prev, username: row.username || prev.username,
                  realName: row.real_name || prev.realName, bio: row.bio || '',
                  avatar: row.avatar || '', nickname: row.nickname || prev.nickname || '',
                } : prev);
              }
            });
          } else {
            loadAll();
          }
        })
        .subscribe(),
    );
    return () => channels.forEach((c) => supabase.removeChannel(c));
  }, [loadAll, user?.uid]);

  // 启动时刷新当前用户资料
  useEffect(() => {
    if (!user?.uid) return;
    supabase.from('users').select('*').eq('uid', user.uid).then(({ data }) => {
      if (data && data.length > 0) {
        const row = data[0] as any;
        setUser((prev) => prev ? {
          ...prev, username: row.username || prev.username, realName: row.real_name || prev.realName,
          bio: row.bio || '', avatar: row.avatar || '', nickname: row.nickname || prev.nickname || '',
        } : prev);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  /* ---------------- 菜品 / 评论 ---------------- */
  const addReview = useCallback((dishId: number, tier: number, text: string): Promise<boolean> => {
    if (!user?.uid) return Promise.resolve(false);
    return Promise.resolve(supabase.from('ratings').insert({
      dish_id: dishId, user_uid: user.uid, tier: encodeTier(tier), text: text.trim(), author_name: user.username,
    }).then(({ error }) => { if (!error) loadAll(); return !error; }));
  }, [user, loadAll]);

  const toggleLike = useCallback((dishId: number, reviewId: number) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d, reviews: d.reviews.map((r) => r.id === reviewId
        ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r),
    }));
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('rating_likes').select('id')
        .eq('rating_id', String(reviewId)).eq('user_uid', user.uid!);
      if (data && data.length > 0) await supabase.from('rating_likes').delete().eq('id', data[0].id);
      else await supabase.from('rating_likes').insert({ rating_id: String(reviewId), user_uid: user.uid! });
      loadAll();
    })();
  }, [user, loadAll]);

  const updateReview = useCallback((dishId: number, reviewId: number, newText: string) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d, reviews: d.reviews.map((r) => r.id === reviewId ? { ...r, text: newText } : r),
    }));
    supabase.from('ratings').update({ text: newText }).eq('id', reviewId).then(() => loadAll());
  }, [loadAll]);

  const deleteReview = useCallback((dishId: number, reviewId: number): Promise<boolean> =>
    Promise.resolve((async () => {
      const { data } = await supabase.from('ratings').select('user_uid').eq('id', reviewId).maybeSingle();
      const authorUid = data?.user_uid as string | undefined;
      const { error } = await supabase.from('ratings').delete().eq('id', reviewId);
      if (error) return false;
      loadAll();
      if (authorUid && authorUid !== user?.uid) await notify([authorUid], 'admin', '你的某条评价已被管理员删除');
      return true;
    })()), [loadAll, notify, user?.uid]);

  const replyReview = useCallback((dishId: number, reviewId: number, text: string) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d, reviews: d.reviews.map((r) => r.id === reviewId
        ? { ...r, replies: [...r.replies, { id: Date.now(), author: user?.username || '我', text }] } : r),
    }));
    (async () => {
      await supabase.from('rating_replies').insert({
        rating_id: String(reviewId), author_uid: user?.uid || '',
        author_name: user?.username || '我', text,
      });
      const { data } = await supabase.from('ratings').select('user_uid').eq('id', reviewId).maybeSingle();
      if (data?.user_uid && data.user_uid !== user?.uid) {
        await notify([data.user_uid], 'reply', `你的评价收到了新回复：${text.slice(0, 40)}`);
      }
      loadAll();
    })();
  }, [user, notify, loadAll]);

  /* ---------------- 反馈 ---------------- */
  const addFeedback = useCallback((
    kind: 'suggest' | 'complain', text: string, anonymous: boolean,
  ): Promise<boolean> => Promise.resolve((async () => {
    const { error } = await supabase.from('feedbacks').insert({
      author_uid: user?.uid || '', author_name: user?.username || '匿名',
      author_real_name: user?.realName || '', kind, text, anonymous, status: 'pending',
    });
    if (error) return false;
    await notify(await adminTargets(), 'admin', `📬 收到一条新${kind === 'complain' ? '投诉' : '建议'}：${text.slice(0, 30)}`);
    loadAll();
    return true;
  })()), [user, notify, adminTargets, loadAll]);

  const replyFeedback = useCallback((id: number, reply: string): Promise<boolean> => {
    // 乐观更新：立即在本地标记已回复，UI 秒回，不再串行等网络（原来 select→update→notify→loadAll 要 ~5s）。
    // 落库和通知放后台异步执行，失败时才回滚并重新拉取，保证数据最终一致。
    const target = feedbacks.find((f) => f.id === id);
    if (!target) return Promise.resolve(false);
    const adminRep = user?.username || '管理员';
    const now = new Date().toISOString();
    setFeedbacks((prev) => prev.map((f) => f.id === id
      ? { ...f, status: 'replied', reply, adminRep, repliedAt: now }
      : f));
    (async () => {
      const { error } = await supabase.from('feedbacks').update({
        status: 'replied', reply, admin_rep: adminRep, replied_at: now,
      }).eq('id', id);
      if (error) { loadAll(); return; }
      if (!target.anonymous && target.authorUid) {
        await notify([target.authorUid], 'feedback', `你的反馈已收到管理员「${adminRep}」的回复：${reply.slice(0, 40)}`);
      }
      loadAll();
    })();
    return Promise.resolve(true);
  }, [user, notify, loadAll, feedbacks]);

  /* ---------------- 菜品管理 ---------------- */
  const addDish = useCallback((name: string, price: number, windowId: IDish['windowId']): Promise<boolean> => {
    const today = new Date().toISOString().slice(0, 10);
    return Promise.resolve((async () => {
      const { data, error } = await supabase.from('dishes').insert({ name, price, dish_window: windowId }).select('id').single();
      if (error || data?.id == null) return false;
      await supabase.from(BUS).insert({
        kind: K.LAUNCH, author_uid: user?.uid || '00000000', author_name: user?.username || 'admin',
        text: jstr({ dishId: data.id, date: today }),
      });
      loadAll();
      return true;
    })());
  }, [user, loadAll]);

  const deleteDish = useCallback((id: number): Promise<boolean> => Promise.resolve(
    supabase.from('dishes').delete().eq('id', id).then(({ error }) => { if (!error) loadAll(); return !error; }),
  ), [loadAll]);

  const banUser = useCallback((uid: string): Promise<boolean> => Promise.resolve(
    supabase.from('users').update({ role: 'banned' }).eq('uid', uid).then(({ error }) => !error),
  ), []);

  const setDishImage = useCallback((id: number, image: string) => {
    supabase.from('dishes').update({ image }).eq('id', id).then(() => loadAll());
  }, [loadAll]);
  const setDishMeal = useCallback((id: number, meal: string) => {
    supabase.from('dishes').update({ meal_type: meal }).eq('id', id).then(() => loadAll());
  }, [loadAll]);
  const setDishTags = useCallback((id: number, tags: string[]) => {
    supabase.from('dishes').update({ tags }).eq('id', id).then(() => loadAll());
  }, [loadAll]);
  const toggleDishNew = useCallback((id: number) => {
    const target = dishes.find((d) => d.id === id);
    if (!target) return;
    setDishes((prev) => prev.map((d) => d.id === id ? { ...d, isNew: !d.isNew } : d));
    supabase.from('dishes').update({ is_new: !target.isNew }).eq('id', id).then(() => loadAll());
  }, [dishes, loadAll]);

  /* ---------------- 头像框 / 关注 / 主页头图 ---------------- */
  const generateFrameCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `WLLC-${code}`;
  }, []);

  const uploadFrame = useCallback((
    frame: Omit<IAvatarFrame, 'id' | 'issuedTo' | 'code'> & { code?: string; maxClaims?: number; expiresAt?: string },
  ): Promise<boolean> => Promise.resolve(supabase.from('avatar_frames').insert({
    name: frame.name, image_url: frame.imageUrl, description: frame.unlockText,
    code: frame.code || generateFrameCode(), max_claims: frame.maxClaims || null,
    expires_at: frame.expiresAt || null, issued_to: [],
  }).then(({ error }) => { if (!error) loadAll(); return !error; })), [generateFrameCode, loadAll]);

  const redeemFrameCode = useCallback((code: string, username: string): { ok: boolean; msg: string; frameId?: string } => {
    const frame = frames.find((f) => f.code === code.toUpperCase());
    if (!frame) return { ok: false, msg: '兑换码无效' };
    if (frame.issuedTo.includes(username)) return { ok: false, msg: '你已经兑换过这个头像框' };
    if (frame.maxClaims && frame.issuedTo.length >= frame.maxClaims) return { ok: false, msg: '兑换码已被领完' };
    if (frame.expiresAt && new Date() > new Date(frame.expiresAt)) return { ok: false, msg: '兑换码已过期' };
    setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, issuedTo: [...f.issuedTo, username] } : f));
    if (/^\d+$/.test(frame.id)) {
      (async () => {
        const { data } = await supabase.from('avatar_frames').select('issued_to').eq('id', Number(frame.id)).maybeSingle();
        const cur = Array.isArray((data as any)?.issued_to) ? (data as any).issued_to : [];
        await supabase.from('avatar_frames').update({ issued_to: [...new Set([...cur, username])] }).eq('id', Number(frame.id));
        loadAll();
      })();
    }
    return { ok: true, msg: `兑换成功！已解锁${frame.name}`, frameId: frame.id };
  }, [frames, loadAll]);

  const issueFrame = useCallback((frameId: string, username: string) => {
    setFrames((prev) => prev.map((f) => f.id === frameId
      ? { ...f, issuedTo: [...new Set([...f.issuedTo, username])] } : f));
    if (!/^\d+$/.test(frameId)) return;
    (async () => {
      const { data } = await supabase.from('avatar_frames').select('issued_to').eq('id', Number(frameId)).maybeSingle();
      const cur = Array.isArray((data as any)?.issued_to) ? (data as any).issued_to : [];
      await supabase.from('avatar_frames').update({ issued_to: [...new Set([...cur, username])] }).eq('id', Number(frameId));
      const { data: target } = await supabase.from('users').select('uid').eq('username', username);
      await notify(target?.[0]?.uid ? [target[0].uid] : [], 'like', '🎁 你获得了新头像框！');
      loadAll();
    })();
  }, [notify, loadAll]);

  const setActiveFrame = useCallback((id: string) => { setMyFrameId(id); upsertPref({ myFrameId: id }); }, [upsertPref]);
  const setHeaderImage = useCallback((url: string) => { setProfileHeader(url); upsertPref({ profileHeader: url }); }, [upsertPref]);

  const toggleFollow = useCallback((author: string) => {
    setFollowees((prev) => prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author]);
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('follows').select('id')
        .eq('follower_uid', user.uid!).eq('followee_name', author);
      if (data && data.length > 0) await supabase.from('follows').delete().eq('id', data[0].id);
      else await supabase.from('follows').insert({ follower_uid: user.uid!, followee_name: author });
      loadAll();
    })();
  }, [user, loadAll]);

  const updateUserProfile = useCallback((patch: Partial<IUser>): Promise<boolean> => {
    const targetUid = user?.uid || '';
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      saveSession(next, next.username === 'WLLC2026', readIds);
      return next;
    });
    const dbPatch: any = {};
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.avatar !== undefined) dbPatch.avatar = patch.avatar;
    if (patch.username !== undefined) dbPatch.username = patch.username;
    if (patch.studentId !== undefined) dbPatch.student_id = patch.studentId;
    if (patch.klass !== undefined) dbPatch.klass = patch.klass;
    if (patch.grade !== undefined) dbPatch.grade = patch.grade;
    if (patch.realName !== undefined) dbPatch.real_name = patch.realName;
    if (patch.showRealInfo !== undefined) dbPatch.show_real_info = patch.showRealInfo;
    // users 表没有 nickname 列：网名存进 app_pref（按 uid 隔离），否则整条 UPDATE 会报 42703
    // 连带 bio/avatar/real_name 一起存不进去，造成跨设备不同步。
    const nicknameWrite = patch.nickname !== undefined ? upsertPref({ nickname: patch.nickname }) : Promise.resolve();
    const dbWrite = Object.keys(dbPatch).length === 0
      ? Promise.resolve(true)
      : supabase.from('users').update(dbPatch).eq('uid', targetUid).then(({ error }) => !error);
    return Promise.all([dbWrite, nicknameWrite]).then(([ok]) => ok);
  }, [readIds, user, upsertPref]);

  /* ---------------- 公告 / Banner / 滚动通知 / 赞赏码 ---------------- */
  const postAnnouncement = useCallback((
    title: string, body: string, imageUrl?: string, linkUrl?: string,
  ): Promise<boolean> => Promise.resolve((async () => {
    const { error } = await supabase.from('announcements').insert({
      title, body, image_url: imageUrl || null, link_url: linkUrl || null,
      author_uid: user?.uid || '00000000', author_name: user?.realName || user?.username || '管理员',
      pinned: false,
    });
    if (error) return false;
    loadAll();
    return true;
  })()), [user, loadAll]);

  const setBanners = useCallback((banners: IBanner[]): Promise<boolean> => {
    setBannersState(banners);
    return Promise.resolve((async () => {
      const { error: delErr } = await supabase.from('banners').delete().gte('id', 0);
      if (delErr) return false;
      if (banners.length > 0) {
        const { error } = await supabase.from('banners').insert(banners.map((b, i) => ({
          title: b.title || '', image_url: b.image || '', link_url: b.target || '', sort_order: i,
        })));
        if (error) return false;
      }
      loadAll();
      return true;
    })());
  }, [loadAll]);

  const setTipsQr = useCallback((qr: string | null) => {
    setTipsQrState(qr);
    upsertSingleton(K.TIPS, { qr });
  }, [upsertSingleton]);

  const unreadAnnouncement = useMemo(
    () => announcements.find((a) => !readIds.includes(a.id)) ?? null,
    [announcements, readIds],
  );
  const markAnnouncementRead = useCallback((id: number) => {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      if (user) saveSession(user, isAdmin, next);
      return next;
    });
  }, [user, isAdmin]);

  const setTicker = useCallback((text: string): Promise<boolean> => {
    setTickerState(text);
    return upsertSingleton(K.TICKER, { text });
  }, [upsertSingleton]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user?.uid) return;
    supabase.from('notifications').update({ read: true })
      .eq('target_uid', user.uid!).eq('read', false).then(() => loadAll());
  }, [user?.uid, loadAll]);

  const sendAdminMessage = useCallback((target: string, text: string): Promise<boolean> => {
    const msg = target ? `致 @${target}：${text}` : `管理员：${text}`;
    return Promise.resolve((async () => {
      if (!target) return notify(await supabase.from('users').select('uid').then(({ data }) =>
        (data || []).map((r: any) => r.uid)), 'admin', msg);
      const { data } = await supabase.from('users').select('uid').eq('username', target);
      return notify(data?.[0]?.uid ? [data[0].uid] : [target], 'admin', msg);
    })());
  }, [notify]);

  const togglePin = useCallback((id: number) => {
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a));
    (async () => {
      const { data } = await supabase.from('announcements').select('pinned').eq('id', id).maybeSingle();
      if (!data) return;
      await supabase.from('announcements').update({ pinned: !(data as any).pinned }).eq('id', id);
      loadAll();
    })();
  }, [loadAll]);

  // 统一管理员判定：session 标志 或 teacher 角色 或总管理员账号。
  // 邀请码注册的普通管理员 role=teacher 但 session 的 isAdmin 标志可能为 false（completeProfile 写死 false），
  // 导致金框/标签/管理入口全部不显示——这里按角色补齐，所有消费点一致。
  const isAdminEffective = isAdmin || user?.role === 'teacher' ||
    user?.username === 'WLLC2026' || user?.uid === '00000000';

  const value: AppStoreValue = {
    user, isAdmin: isAdminEffective, dishes, announcements, banners, feedbacks, tipsQr, settings, setSettings,
    loginWithPhone, loginWithWechat, loginWithAccountPwd, completeProfile, logout, switchAccount, savedAccounts,
    addReview, toggleLike, deleteReview, updateReview, replyReview,
    addFeedback, replyFeedback, addDish, deleteDish, banUser, toggleDishNew,
    setDishImage, setDishMeal, setDishTags,
    followees, toggleFollow, frames, myFrameId, setActiveFrame, issueFrame, uploadFrame,
    redeemFrameCode, generateFrameCode, profileHeader, setHeaderImage, updateUserProfile,
    postAnnouncement, setBanners, setTipsQr, unreadAnnouncement, markAnnouncementRead,
    ticker, setTicker, myRatings, wants, toggleWant, notifications, markAllNotificationsRead,
    sendAdminMessage, togglePin,
    hideBottomNav, setHideBottomNav, notifyGroup, getProfile,
  };

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}
