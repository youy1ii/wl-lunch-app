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
  const [tipsQr, setTipsQrState] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<ISettings>(loadSettings);
  const [readIds, setReadIds] = useState<number[]>(initial.readIds);
  const [ticker, setTickerState] = useState('本周新品：港式叉烧已上线，欢迎来打分！');
  const [myRatings, setMyRatings] = useState<Record<number, number>>({});
  const [notifications, setNotifications] = useState<INotification[]>([
    { id: 1, kind: 'like', text: '@食堂观察员 赞了你的评价「这个真的夯」', time: '10分钟前', read: false },
    { id: 2, kind: 'reply', text: '@米饭仙人 回复了你：+1 我也觉得', time: '1小时前', read: false },
    { id: 3, kind: 'admin', text: '管理员：请文明打分，谢谢配合', time: '昨天', read: true },
  ]);

  const setSettings = useCallback((patch: Partial<ISettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(`${NS}:settings`, JSON.stringify(next));
      } catch {
        /* 静默 */
      }
      return next;
    });
  }, []);

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
      const u = { uid: '00000000', username: 'admin', realName: '管理员', role: 'teacher' as const, showRealInfo: false };
      setIsAdmin(true);
      setUser(u);
      saveSession(u, true, readIds);
      return {};
    }
    setPendingLoginName(account || '同学');
    return { needProfile: true };
  }, [readIds]);

  const completeProfile = useCallback(
    (u: IUser) => {
      if (!u.uid) u.uid = String(Math.floor(10000000 + Math.random() * 90000000));
      setUser(u);
      setPendingLoginName('');
      saveSession(u, false, readIds);
      // Save to Supabase
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

  const addReview = useCallback((dishId: number, tier: number, text: string) => {
    setMyRatings((prev) => ({ ...prev, [dishId]: tier }));
    // Save to Supabase
    if (user?.uid) {
      supabase.from('ratings').insert({
        dish_id: dishId,
        user_uid: user.uid,
        tier,
        text: text.trim(),
      }).then(() => {});
    }
    const hasText = text.trim().length > 0;
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id !== dishId) return d;
        const counts = [...d.counts];
        counts[tier - 1] += 1;
        if (!hasText) return { ...d, counts };
        const review = {
          id: Date.now(),
          author: '我',
          tier,
          text: text.trim(),
          likes: 0,
          liked: false,
          replies: [],
          mine: true,
        };
        return { ...d, counts, reviews: [review, ...d.reviews] };
      }),
    );
  }, []);

  const toggleLike = useCallback((dishId: number, reviewId: number) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id !== dishId
          ? d
          : {
              ...d,
              reviews: d.reviews.map((r) =>
                r.id === reviewId
                  ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) }
                  : r,
              ),
            },
      ),
    );
  }, []);

  const deleteReview = useCallback((dishId: number, reviewId: number) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id !== dishId) return d;
        const target = d.reviews.find((r) => r.id === reviewId);
        if (!target) return d;
        const counts = [...d.counts];
        counts[target.tier - 1] = Math.max(0, counts[target.tier - 1] - 1);
        return { ...d, counts, reviews: d.reviews.filter((r) => r.id !== reviewId) };
      }),
    );
  }, []);

  const replyReview = useCallback((dishId: number, reviewId: number, text: string) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id !== dishId
          ? d
          : {
              ...d,
              reviews: d.reviews.map((r) =>
                r.id === reviewId
                  ? { ...r, replies: [...r.replies, { id: Date.now(), author: '我', text }] }
                  : r,
              ),
            },
      ),
    );
  }, []);

  const addFeedback = useCallback(
    (kind: 'suggest' | 'complain', text: string, anonymous: boolean) => {
      setFeedbacks((prev) => [
        {
          id: Date.now(),
          kind,
          text,
          anonymous,
          status: 'pending',
          author: user?.username ?? '匿名',
        },
        ...prev,
      ]);
    },
    [user],
  );

  const replyFeedback = useCallback((id: number, reply: string) => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'replied' as const, reply } : f)),
    );
  }, []);

  const addDish = useCallback((name: string, price: number, windowId: IDish['windowId']) => {
    setDishes((prev) => [
      {
        id: Math.max(...prev.map((d) => d.id)) + 1,
        name,
        price,
        windowId,
        counts: [0, 0, 0, 0, 0],
        reviews: [],
      },
      ...prev,
    ]);
  }, []);

  const deleteDish = useCallback((id: number) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const uploadFrame = useCallback((frame: Omit<IAvatarFrame, 'id' | 'issuedTo'>) => {
    setFrames((prev) => [...prev, { ...frame, id: `f${Date.now()}`, issuedTo: [] }]);
  }, []);

  const issueFrame = useCallback((frameId: string, username: string) => {
    setFrames((prev) => prev.map((f) => f.id === frameId ? { ...f, issuedTo: [...new Set([...f.issuedTo, username])] } : f));
    // push notification
    setNotifications((prev) => [...prev, { id: Date.now(), kind: 'like' as const, text: `🎁 你获得了新头像框！`, time: new Date().toISOString(), read: false }]);
  }, []);

  const setActiveFrame = useCallback((id: string) => setMyFrameId(id), []);
  const setHeaderImage = useCallback((url: string) => setProfileHeader(url), []);

  const toggleFollow = useCallback((author: string) => {
    setFollowees((prev) =>
      prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author],
    );
  }, []);

  const updateUserProfile = useCallback((patch: Partial<IUser>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const toggleDishNew = useCallback((id: number) => {
    setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, isNew: !d.isNew } : d)));
  }, []);

  const postAnnouncement = useCallback((title: string, body: string, imageUrl?: string, linkUrl?: string) => {
    setAnnouncements((prev) => [
      { id: Date.now(), title, body, date: new Date().toISOString().slice(0, 10), imageUrl, linkUrl },
      ...prev,
    ]);
  }, []);

  const setBanners = useCallback((banners: IBanner[]) => setBannersState(banners), []);
  const setTipsQr = useCallback((qr: string | null) => setTipsQrState(qr), []);

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

  const setTicker = useCallback((text: string) => setTickerState(text), []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const sendAdminMessage = useCallback((target: string, text: string) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        kind: 'admin',
        text: target ? `致 @${target}：${text}` : `管理员：${text}`,
        time: '刚刚',
        read: false,
      },
      ...prev,
    ]);
  }, []);
  const togglePin = useCallback((id: number) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));
  }, []);

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
    addReview,
    toggleLike,
    deleteReview,
    replyReview,
    addFeedback,
    replyFeedback,
    addDish,
    deleteDish,
    toggleDishNew,
    followees,
    toggleFollow,
    frames,
    myFrameId,
    setActiveFrame,
    issueFrame,
    uploadFrame,
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
    notifications,
    markAllNotificationsRead,
    sendAdminMessage,
    togglePin,
  };

  // Load dishes from Supabase
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('dishes').select('*');
      if (data && data.length > 0) {
        setDishes((prev) => prev.map((d) => {
          const s = data.find((x: any) => x.id === d.id);
          if (!s) return d;
          return { ...d, name: s.name, price: s.price, windowId: s.dish_window, vegetarian: s.vegetarian, isNew: s.is_new };
        }));
      }
    })();
  }, []);

  // Save new reviews to Supabase
  useEffect(() => {
    if (!user) return;
  }, [user]);

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}
