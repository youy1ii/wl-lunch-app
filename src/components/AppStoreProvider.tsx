import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppStore, type AppStoreValue } from '@/lib/store-context';
import { MOCK_ANNOUNCEMENTS, MOCK_BANNERS, MOCK_DISHES } from '@/lib/mock-data';
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

/* ============================================================
   统一共享总线：所有共享数据都放在 admin_messages 一张表里
   ------------------------------------------------------------
   列映射：
     id          -> 各实体的稳定数字 id
     created_at  -> 创建时间
     author_uid  -> 按 kind 定义（通知=接收者；关注/点赞=操作者）
     author_name -> 作者名 / 通知来源
     text        -> JSON 字符串（payload）
     kind        -> app_ 前缀区分数据类型，避免和群聊的 message/announcement/mention/activity 冲突
   ============================================================ */
const BUS = 'admin_messages';
const K = {
  FEEDBACK: 'app_feedback',
  NOTICE: 'app_notice',
  ANNOUNCE: 'app_announce',
  BANNER: 'app_banner',
  FOLLOW: 'app_follow',
  LIKE: 'app_like',
  REPLY: 'app_reply',
  FRAME: 'app_frame',
  PREF: 'app_pref',
  TICKER: 'app_ticker',
  TIPS: 'app_tips',
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
  } catch {
    /* 静默 */
  }
}

function loadSettings(): ISettings {
  const fb: ISettings = {
    lang: 'zh',
    accent: '#E8B923',
    bgColor: '',
    textColor: '',
    bgImage: null,
    bgBlur: 0,
    frosted: true,
    opacity: 0.82,
    parallax: true,
    haptics: true,
    font: null,
  };
  try {
    const raw = localStorage.getItem(`${NS}:settings`);
    return raw ? { ...fb, ...(JSON.parse(raw) as Partial<ISettings>) } : fb;
  } catch {
    return fb;
  }
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
  const [dishes, setDishes] = useState<IDish[]>(MOCK_DISHES);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>(MOCK_ANNOUNCEMENTS);
  const [banners, setBannersState] = useState<IBanner[]>(MOCK_BANNERS);
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [tipsQr, setTipsQrState] = useState<string | null>(`${import.meta.env.BASE_URL}tip.jpg`);
  const [settings, setSettingsState] = useState<ISettings>(loadSettings);
  const [readIds, setReadIds] = useState<number[]>(initial.readIds);
  const [ticker, setTickerState] = useState('欢迎各位参与内测!');
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [wants, setWantsState] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('wl-lunch:wants') || '[]'); } catch { return []; } });
  const toggleWant = useCallback((id: number) => {
    setWantsState((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('wl-lunch:wants', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const setSettings = useCallback((patch: Partial<ISettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(`${NS}:settings`, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ---------------- 登录 / 账号（保持原行为，注册流程不改） ---------------- */
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
              uid: row.uid || '00000000',
              username: row.username || 'WLLC2026',
              realName: row.real_name || 'WLLC2026',
              role: 'teacher',
              bio: row.bio || '',
              avatar: row.avatar || '',
              showRealInfo: true,
            } as any;
          } else {
            u = { uid: '00000000', username: 'WLLC2026', realName: 'WLLC2026', role: 'teacher', bio: '', avatar: '', showRealInfo: true } as any;
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
          if (row.role === 'banned') {
            resolve({ bad: '该账号已被封禁，无法登录' });
            return;
          }
          if (row.password && row.password !== pwd) {
            resolve({ bad: '密码不对' });
            return;
          }
          const u: IUser = {
            uid: row.uid,
            username: row.username,
            realName: row.real_name || row.username,
            role: row.role || 'student',
            studentId: row.student_id,
            klass: row.klass,
            grade: row.grade,
            bio: row.bio,
            avatar: row.avatar,
            showRealInfo: false,
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

  const completeProfile = useCallback(
    (u: IUser) => {
      if (!u.uid) u.uid = String(Math.floor(10000000 + Math.random() * 90000000));
      setUser(u);
      setPendingLoginName('');
      saveSession(u, false, readIds);
      supabase.from('users').upsert({
        uid: u.uid,
        username: u.username,
        real_name: u.realName,
        role: u.role,
        student_id: u.studentId,
        klass: u.klass,
        grade: u.grade,
      }).then(() => {});
    },
    [readIds],
  );

  const logout = useCallback(() => {
    setUser(null);
    setIsAdmin(false);
    saveSession(null, false, []);
  }, []);

  const switchAccount = useCallback((uid: string) => {
    const list = getAccountList();
    const entry = list.find((a) => a.user.uid === uid);
    if (!entry) return;
    setUser(entry.user);
    setIsAdmin(entry.isAdmin);
    saveSession(entry.user, entry.isAdmin, readIds);
  }, [readIds]);

  const savedAccounts = getAccountList();

  /* ---------------- 共享数据：一次拉取，全端一致 ---------------- */
  const buildDishes = useCallback((
    dishRows: any[],
    ratingRows: any[],
    meUid?: string,
    likeRows: BusRow[] = [],
    replyRows: BusRow[] = [],
    launchMap: Record<number, string> = {},
  ) => {
    const likePayloads = likeRows.map((r) => ({ uid: r.author_uid, ...jparse(r.text) }));
    const replyPayloads = replyRows.map((r) => ({ id: r.id, author: r.author_name, ...jparse(r.text) }));
    return dishRows.map((d: any) => {
      const counts = [0, 0, 0, 0, 0];
      const reviews: any[] = [];
      let earliest: string | undefined;
      ratingRows.forEach((r: any) => {
        if (r.dish_id !== d.id) return;
        if (r.created_at && (!earliest || r.created_at < earliest)) earliest = r.created_at;
        counts[r.tier - 1] = (counts[r.tier - 1] || 0) + 1;
        if (r.text && r.text.trim()) {
          reviews.push({
            id: r.id,
            author: r.author_name || '同学',
            tier: r.tier,
            text: r.text,
            likes: 0,
            liked: false,
            replies: [],
            mine: meUid ? r.user_uid === meUid : false,
            authorUid: r.user_uid || undefined,
            createdAt: r.created_at,
          });
        }
      });
      // 共享点赞 / 楼中楼回复
      reviews.forEach((rv) => {
        const ls = likePayloads.filter((p) => Number(p.reviewId) === Number(rv.id));
        rv.likes = ls.length;
        rv.liked = meUid ? ls.some((p) => p.uid === meUid) : false;
        rv.replies = replyPayloads
          .filter((p) => Number(p.reviewId) === Number(rv.id))
          .map((p) => ({ id: Number(p.id), author: p.author || '同学', text: p.text || '' }))
          .sort((a, b) => a.id - b.id);
      });
      reviews.sort((a, b) => b.likes - a.likes);
      // 上线日期：最早评分日期 > 总线记录 > 本地旧记录
      let launchDate: string | undefined = earliest ? earliest.slice(0, 10) : undefined;
      if (!launchDate) launchDate = launchMap[d.id];
      if (!launchDate) {
        try {
          const map = JSON.parse(localStorage.getItem('wl-lunch:dish-launch') || '{}');
          launchDate = map[d.id];
        } catch {}
      }
      return {
        id: d.id,
        name: d.name,
        price: d.price,
        windowId: d.dish_window || ('A' as any),
        launchDate,
        counts,
        reviews,
        veggie: d.vegetarian,
        isNew: d.is_new,
        mealType: d.meal_type,
        tags: d.tags || [],
        image: d.image || undefined,
      } as IDish;
    });
  }, []);

  const loadAll = useCallback(async () => {
    const uid = user?.uid || '';
    const isAdminNow = !!(
      user?.username === 'WLLC2026' || user?.uid === '00000000' ||
      user?.role === 'teacher' || isAdmin
    );

    const [busRes, dishRes, ratingRes] = await Promise.all([
      supabase.from(BUS).select('*').order('id', { ascending: true }),
      supabase.from('dishes').select('*'),
      supabase.from('ratings').select('*'),
    ]);

    const rows = ((busRes.data || []) as BusRow[]).filter((r) => String(r.kind || '').startsWith('app_'));
    const byKind = (k: string) => rows.filter((r) => r.kind === k);
    const dishRows = dishRes.data || [];
    const ratingRows = ratingRes.data || [];

    // 菜品 + 共享点赞/回复/上线日期
    const launchMap: Record<number, string> = {};
    byKind(K.LAUNCH).forEach((r) => {
      const p = jparse(r.text);
      if (p.dishId != null && p.date) launchMap[p.dishId] = p.date;
    });
    if (dishRows.length > 0) {
      setDishes(buildDishes(dishRows, ratingRows, uid, byKind(K.LIKE), byKind(K.REPLY), launchMap));
    }
    const mine: Record<number, number> = {};
    if (uid) ratingRows.forEach((r: any) => { if (r.user_uid === uid) mine[r.dish_id] = r.tier; });
    setMyRatings(mine);

    // 反馈
    setFeedbacks(byKind(K.FEEDBACK).map((r) => {
      const p = jparse(r.text);
      return {
        id: r.id,
        kind: p.kind === 'complain' ? 'complain' : 'suggest',
        text: p.text || '',
        anonymous: !!p.anonymous,
        status: p.status === 'replied' ? 'replied' : 'pending',
        reply: p.reply || undefined,
        author: p.anonymous ? '匿名' : (p.authorName || r.author_name || '同学'),
        authorUid: r.author_uid || undefined,
        authorRealName: p.anonymous ? '' : (p.authorRealName || ''),
        adminRep: p.adminRep || undefined,
        repliedAt: p.repliedAt || undefined,
      } as IFeedback;
    }).reverse());

    // 通知：定向 / 管理员组 / 本人
    setNotifications(byKind(K.NOTICE).filter((r) => {
      const t = r.author_uid;
      return !!uid && (t === uid || t === 'ALL' || (isAdminNow && t === '00000000'));
    }).map((r) => {
      const p = jparse(r.text);
      return {
        id: r.id,
        kind: (['like', 'reply', 'admin', 'feedback'].includes(p.nkind) ? p.nkind : 'admin') as INotification['kind'],
        text: p.text || '',
        time: r.created_at,
        read: !!p.read,
        feedbackText: p.feedbackText,
        replyText: p.replyText,
        adminRep: p.adminRep,
        replyTime: p.replyTime,
      } as INotification;
    }).reverse());

    // 公告
    if (byKind(K.ANNOUNCE).length > 0) {
      setAnnouncements(byKind(K.ANNOUNCE).map((r) => {
        const p = jparse(r.text);
        return {
          id: r.id,
          title: p.title || '',
          body: p.body || '',
          date: (r.created_at || '').slice(0, 10),
          imageUrl: p.imageUrl || undefined,
          linkUrl: p.linkUrl || undefined,
          authorUid: r.author_uid || undefined,
          authorName: r.author_name || undefined,
          pinned: !!p.pinned,
        } as IAnnouncement & { authorName?: string };
      }).reverse());
    }

    // Banner
    setBannersState(byKind(K.BANNER).map((r) => {
      const p = jparse(r.text);
      return {
        id: r.id,
        title: p.title || '',
        target: p.target || '',
        image: p.image || undefined,
      } as IBanner;
    }));

    // 头像框
    setFrames(byKind(K.FRAME).map((r) => {
      const p = jparse(r.text);
      return {
        id: String(r.id),
        name: p.name || '',
        imageUrl: p.imageUrl || '',
        unlockText: p.unlockText || '',
        issuedTo: Array.isArray(p.issuedTo) ? p.issuedTo : [],
        special: !!p.special,
        code: p.code || undefined,
        maxClaims: p.maxClaims,
        expiresAt: p.expiresAt,
      } as IAvatarFrame;
    }));

    // 关注（当前用户）
    setFollowees(uid
      ? byKind(K.FOLLOW).filter((r) => r.author_uid === uid).map((r) => jparse(r.text).author).filter(Boolean)
      : []);

    // 滚动通知 / 赞赏码（单条）
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

    // 个人展示偏好（头像框 / 主页头图）
    const prefRow = uid ? byKind(K.PREF).find((r) => r.author_uid === uid) : undefined;
    if (prefRow) {
      const p = jparse(prefRow.text);
      setMyFrameId(p.myFrameId || '');
      setProfileHeader(p.profileHeader || '');
    }
  }, [user?.uid, user?.username, user?.role, isAdmin, buildDishes]);

  /* ---------------- 总线写入助手 ---------------- */
  const notify = useCallback(async (
    targets: string[],
    nkind: INotification['kind'],
    text: string,
    extra?: Partial<INotification>,
  ): Promise<boolean> => {
    const list = [...new Set(targets.filter(Boolean))];
    if (!list.length) return false;
    const { error } = await supabase.from(BUS).insert(list.map((t) => ({
      author_uid: t,
      author_name: user?.username || 'system',
      kind: K.NOTICE,
      text: jstr({ nkind, text, read: false, ...(extra || {}) }),
    })));
    if (!error) loadAll();
    return !error;
  }, [user?.username, loadAll]);

  const adminTargets = useCallback(async (): Promise<string[]> => {
    const { data } = await supabase.from('users').select('uid').in('role', ['teacher', 'admin']);
    return [...new Set(['00000000', ...(data || []).map((r: any) => r.uid).filter(Boolean)])];
  }, []);

  const upsertPref = useCallback(async (patch: Record<string, any>) => {
    if (!user?.uid) return;
    const { data } = await supabase.from(BUS).select('id,text').eq('kind', K.PREF).eq('author_uid', user.uid).maybeSingle();
    if (data) {
      await supabase.from(BUS).update({ text: jstr({ ...jparse(data.text), ...patch }) }).eq('id', data.id);
    } else {
      await supabase.from(BUS).insert({
        kind: K.PREF, author_uid: user.uid, author_name: user.username || '', text: jstr(patch),
      });
    }
    loadAll();
  }, [user, loadAll]);

  const upsertSingleton = useCallback(async (kind: string, payload: any): Promise<boolean> => {
    const { data } = await supabase.from(BUS).select('id').eq('kind', kind).order('id', { ascending: true }).limit(1).maybeSingle();
    const res = data
      ? await supabase.from(BUS).update({ text: jstr(payload) }).eq('id', data.id)
      : await supabase.from(BUS).insert({
          kind, author_uid: user?.uid || '00000000', author_name: user?.username || 'system', text: jstr(payload),
        });
    if (!res.error) loadAll();
    return !res.error;
  }, [user, loadAll]);

  // 初始加载 + 实时订阅（整张总线一张表，所有设备同步）
  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const chBus = supabase.channel('realtime-bus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => loadAll())
      .subscribe();
    const chRatings = supabase.channel('realtime-ratings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, () => loadAll())
      .subscribe();
    const chDishes = supabase.channel('realtime-dishes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => loadAll())
      .subscribe();
    const chUsers = supabase.channel('realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        if (!user?.uid) return;
        supabase.from('users').select('*').eq('uid', user.uid).then(({ data }) => {
          if (data && data.length > 0) {
            const row = data[0] as any;
            setUser((prev) => prev ? {
              ...prev,
              username: row.username || prev.username,
              realName: row.real_name || prev.realName,
              bio: row.bio || '',
              avatar: row.avatar || '',
              nickname: row.nickname || prev.nickname || '',
            } : prev);
          }
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(chBus);
      supabase.removeChannel(chRatings);
      supabase.removeChannel(chDishes);
      supabase.removeChannel(chUsers);
    };
  }, [loadAll, user?.uid]);

  // 从数据库刷新当前用户资料（头像/昵称/简介）
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    supabase.from('users').select('*').eq('uid', uid).then(({ data }) => {
      if (data && data.length > 0) {
        const row = data[0] as any;
        setUser((prev) => prev ? {
          ...prev,
          username: row.username || prev.username,
          realName: row.real_name || prev.realName,
          bio: row.bio || '',
          avatar: row.avatar || '',
          nickname: row.nickname || prev.nickname || '',
        } : prev);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  /* ---------------- 菜品 / 评论 ---------------- */
  const addReview = useCallback((dishId: number, tier: number, text: string): Promise<boolean> => {
    if (!user?.uid) return Promise.resolve(false);
    return Promise.resolve(supabase.from('ratings').insert({
      dish_id: dishId,
      user_uid: user.uid,
      tier,
      text: text.trim(),
      author_name: user.username,
    }).then(({ error }) => {
      if (!error) loadAll();
      return !error;
    }));
  }, [user, loadAll]);

  const toggleLike = useCallback((dishId: number, reviewId: number) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d,
      reviews: d.reviews.map((r) => r.id === reviewId
        ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) }
        : r),
    }));
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from(BUS).select('id,text').eq('kind', K.LIKE).eq('author_uid', user.uid!);
      const hit = (data || []).find((r) => {
        const p = jparse(r.text);
        return Number(p.dishId) === Number(dishId) && Number(p.reviewId) === Number(reviewId);
      });
      if (hit) await supabase.from(BUS).delete().eq('id', hit.id);
      else await supabase.from(BUS).insert({
        kind: K.LIKE, author_uid: user.uid!, author_name: user.username || '',
        text: jstr({ dishId, reviewId }),
      });
      loadAll();
    })();
  }, [user, loadAll]);

  const updateReview = useCallback((dishId: number, reviewId: number, newText: string) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d, reviews: d.reviews.map((r) => r.id === reviewId ? { ...r, text: newText } : r),
    }));
    supabase.from('ratings').update({ text: newText }).eq('id', reviewId).then(() => loadAll());
  }, [loadAll]);

  const deleteReview = useCallback((dishId: number, reviewId: number): Promise<boolean> => {
    return Promise.resolve((async () => {
      const { data } = await supabase.from('ratings').select('user_uid').eq('id', reviewId).maybeSingle();
      const authorUid = data?.user_uid as string | undefined;
      const { error } = await supabase.from('ratings').delete().eq('id', reviewId);
      if (error) return false;
      loadAll();
      if (authorUid && authorUid !== user?.uid) {
        await notify([authorUid], 'admin', '你的某条评价已被管理员删除');
      }
      return true;
    })());
  }, [loadAll, notify, user?.uid]);

  const replyReview = useCallback((dishId: number, reviewId: number, text: string) => {
    setDishes((prev) => prev.map((d) => d.id !== dishId ? d : {
      ...d,
      reviews: d.reviews.map((r) => r.id === reviewId
        ? { ...r, replies: [...r.replies, { id: Date.now(), author: user?.username || '我', text }] }
        : r),
    }));
    (async () => {
      await supabase.from(BUS).insert({
        kind: K.REPLY,
        author_uid: user?.uid || '',
        author_name: user?.username || '我',
        text: jstr({ dishId, reviewId, text }),
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
  ): Promise<boolean> => {
    return Promise.resolve((async () => {
      const { error } = await supabase.from(BUS).insert({
        kind: K.FEEDBACK,
        author_uid: user?.uid || '',
        author_name: anonymous ? '匿名' : (user?.username || '匿名'),
        text: jstr({
          kind, text, anonymous, status: 'pending',
          authorName: user?.username || '匿名',
          authorRealName: user?.realName || '',
        }),
      });
      if (error) return false;
      await notify(
        await adminTargets(), 'admin',
        `📬 收到一条新${kind === 'complain' ? '投诉' : '建议'}：${text.slice(0, 30)}`,
      );
      loadAll();
      return true;
    })());
  }, [user, notify, adminTargets, loadAll]);

  const replyFeedback = useCallback((id: number, reply: string): Promise<boolean> => {
    return Promise.resolve((async () => {
      const { data: row } = await supabase.from(BUS).select('text,author_uid').eq('id', id).maybeSingle();
      if (!row) return false;
      const p = jparse(row.text);
      const adminRep = user?.username || '管理员';
      const now = new Date().toISOString();
      const { error } = await supabase.from(BUS).update({
        text: jstr({ ...p, status: 'replied', reply, adminRep, repliedAt: now }),
      }).eq('id', id);
      if (error) return false;
      if (!p.anonymous && row.author_uid) {
        await notify([row.author_uid], 'feedback',
          `你的反馈已收到管理员「${adminRep}」的回复：${reply.slice(0, 40)}`,
          { feedbackText: p.text, replyText: reply, adminRep, replyTime: now });
      }
      if (user) {
        await supabase.from(BUS).insert({
          author_uid: user.uid || '00000000',
          author_name: user.username || '',
          text: `回复了反馈：${reply}`,
          kind: 'activity',
        });
      }
      loadAll();
      return true;
    })());
  }, [user, notify, loadAll]);

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
      try {
        const map = JSON.parse(localStorage.getItem('wl-lunch:dish-launch') || '{}');
        map[data.id] = today;
        localStorage.setItem('wl-lunch:dish-launch', JSON.stringify(map));
      } catch {}
      loadAll();
      return true;
    })());
  }, [user, loadAll]);

  const deleteDish = useCallback((id: number): Promise<boolean> => Promise.resolve(
    supabase.from('dishes').delete().eq('id', id).then(({ error }) => {
      if (!error) loadAll();
      return !error;
    }),
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
  ): Promise<boolean> => {
    const code = frame.code || generateFrameCode();
    return Promise.resolve(supabase.from(BUS).insert({
      kind: K.FRAME,
      author_uid: user?.uid || '00000000',
      author_name: user?.username || 'admin',
      text: jstr({
        name: frame.name, imageUrl: frame.imageUrl, unlockText: frame.unlockText,
        special: !!frame.special, code, maxClaims: frame.maxClaims,
        expiresAt: frame.expiresAt, issuedTo: [],
      }),
    }).then(({ error }) => { if (!error) loadAll(); return !error; }));
  }, [generateFrameCode, user, loadAll]);

  const redeemFrameCode = useCallback((code: string, username: string): { ok: boolean; msg: string; frameId?: string } => {
    const frame = frames.find((f) => f.code === code.toUpperCase());
    if (!frame) return { ok: false, msg: '兑换码无效' };
    if (frame.issuedTo.includes(username)) return { ok: false, msg: '你已经兑换过这个头像框' };
    if (frame.maxClaims && frame.issuedTo.length >= frame.maxClaims) return { ok: false, msg: '兑换码已被领完' };
    if (frame.expiresAt && new Date() > new Date(frame.expiresAt)) return { ok: false, msg: '兑换码已过期' };
    setFrames((prev) => prev.map((f) => f.id === frame.id ? { ...f, issuedTo: [...f.issuedTo, username] } : f));
    if (/^\d+$/.test(frame.id)) {
      (async () => {
        const { data } = await supabase.from(BUS).select('text').eq('id', Number(frame.id)).maybeSingle();
        if (data) {
          const p = jparse(data.text);
          await supabase.from(BUS).update({
            text: jstr({ ...p, issuedTo: [...new Set([...(Array.isArray(p.issuedTo) ? p.issuedTo : []), username])] }),
          }).eq('id', Number(frame.id));
        }
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
      const { data } = await supabase.from(BUS).select('text').eq('id', Number(frameId)).maybeSingle();
      if (data) {
        const p = jparse(data.text);
        await supabase.from(BUS).update({
          text: jstr({ ...p, issuedTo: [...new Set([...(Array.isArray(p.issuedTo) ? p.issuedTo : []), username])] }),
        }).eq('id', Number(frameId));
      }
      const { data: target } = await supabase.from('users').select('uid').eq('username', username);
      await notify(target?.[0]?.uid ? [target[0].uid] : [], 'like', '🎁 你获得了新头像框！');
      loadAll();
    })();
  }, [notify, loadAll]);

  const setActiveFrame = useCallback((id: string) => {
    setMyFrameId(id);
    upsertPref({ myFrameId: id });
  }, [upsertPref]);
  const setHeaderImage = useCallback((url: string) => {
    setProfileHeader(url);
    upsertPref({ profileHeader: url });
  }, [upsertPref]);

  const toggleFollow = useCallback((author: string) => {
    setFollowees((prev) => prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author]);
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from(BUS).select('id,text').eq('kind', K.FOLLOW).eq('author_uid', user.uid!);
      const hit = (data || []).find((r) => jparse(r.text).author === author);
      if (hit) await supabase.from(BUS).delete().eq('id', hit.id);
      else await supabase.from(BUS).insert({
        kind: K.FOLLOW, author_uid: user.uid!, author_name: user.username || '',
        text: jstr({ author }),
      });
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
    if (patch.nickname !== undefined) dbPatch.nickname = patch.nickname;
    if (Object.keys(dbPatch).length === 0) return Promise.resolve(true);
    return Promise.resolve(supabase.from('users').update(dbPatch).eq('uid', targetUid).then(({ error }) => !error));
  }, [readIds, user]);

  /* ---------------- 公告 / Banner / 滚动通知 / 赞赏码 ---------------- */
  const postAnnouncement = useCallback((
    title: string, body: string, imageUrl?: string, linkUrl?: string,
  ): Promise<boolean> => {
    return Promise.resolve((async () => {
      const { error } = await supabase.from(BUS).insert({
        kind: K.ANNOUNCE,
        author_uid: user?.uid || '00000000',
        author_name: user?.realName || user?.username || '管理员',
        text: jstr({
          title, body,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined,
          pinned: false,
        }),
      });
      if (error) return false;
      if (user) {
        await supabase.from(BUS).insert({
          author_uid: user.uid || '00000000',
          author_name: user.username || '',
          text: `发布了公告：${title}`,
          kind: 'activity',
        });
      }
      loadAll();
      return true;
    })());
  }, [user, loadAll]);

  const setBanners = useCallback((banners: IBanner[]): Promise<boolean> => {
    setBannersState(banners);
    return Promise.resolve((async () => {
      const { error: delErr } = await supabase.from(BUS).delete().eq('kind', K.BANNER);
      if (delErr) return false;
      if (banners.length > 0) {
        const { error } = await supabase.from(BUS).insert(banners.map((b) => ({
          kind: K.BANNER,
          author_uid: user?.uid || '00000000',
          author_name: user?.username || 'admin',
          text: jstr({ title: b.title || '', target: b.target || '', image: b.image || '' }),
        })));
        if (error) return false;
      }
      loadAll();
      return true;
    })());
  }, [user, loadAll]);

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
    (async () => {
      const { data } = await supabase.from(BUS).select('id,text').eq('kind', K.NOTICE).eq('author_uid', user.uid!);
      for (const r of (data || [])) {
        const p = jparse(r.text);
        if (!p.read) {
          await supabase.from(BUS).update({ text: jstr({ ...p, read: true }) }).eq('id', r.id);
        }
      }
    })();
  }, [user?.uid]);

  const sendAdminMessage = useCallback((target: string, text: string): Promise<boolean> => {
    const msg = target ? `致 @${target}：${text}` : `管理员：${text}`;
    return Promise.resolve((async () => {
      let targets: string[] = [];
      if (!target) {
        const { data } = await supabase.from('users').select('uid');
        targets = (data || []).map((r: any) => r.uid).filter(Boolean);
      } else {
        const { data } = await supabase.from('users').select('uid').eq('username', target);
        targets = data?.[0]?.uid ? [data[0].uid] : [target];
      }
      return notify(targets, 'admin', msg);
    })());
  }, [notify]);

  const togglePin = useCallback((id: number) => {
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a));
    (async () => {
      const { data } = await supabase.from(BUS).select('text').eq('id', id).maybeSingle();
      if (!data) return;
      const p = jparse(data.text);
      await supabase.from(BUS).update({ text: jstr({ ...p, pinned: !p.pinned }) }).eq('id', id);
      loadAll();
    })();
  }, [loadAll]);

  const value: AppStoreValue = {
    user,
    isAdmin,
    dishes,
    announcements,
    banners,
    feedbacks,
    tipsQr,
    settings,
    setSettings,
    loginWithPhone,
    loginWithWechat,
    loginWithAccountPwd,
    completeProfile,
    logout,
    switchAccount,
    savedAccounts,
    addReview,
    toggleLike,
    deleteReview,
    updateReview,
    replyReview,
    addFeedback,
    replyFeedback,
    addDish,
    deleteDish,
    banUser,
    toggleDishNew,
    setDishImage,
    setDishMeal,
    setDishTags,
    followees,
    toggleFollow,
    frames,
    myFrameId,
    setActiveFrame,
    issueFrame,
    uploadFrame,
    redeemFrameCode,
    generateFrameCode,
    profileHeader,
    setHeaderImage,
    updateUserProfile,
    postAnnouncement,
    setBanners,
    setTipsQr,
    unreadAnnouncement,
    markAnnouncementRead,
    ticker,
    setTicker,
    myRatings,
    wants,
    toggleWant,
    notifications,
    markAllNotificationsRead,
    sendAdminMessage,
    togglePin,
  };

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}
