import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Trophy, UtensilsCrossed, UserRound } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import LoginPage from '@/pages/LoginPage/LoginPage';
import AnnouncePopup from '@/components/AnnouncePopup';
import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/types';

// 每种界面语言一套字体栈：切换语言时整套 UI 字形跟着变（用户自定义字体优先）
// 注意：非中文语言也必须在末尾保留中文字体兜底，否则界面里残留的中文会回退到系统宋体。
const CJK_FALLBACK = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB'";
const LANG_FONT_STACK: Record<Lang, string> = {
  zh: "'Noto Sans SC', 'LarkHackSafariFont', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif",
  ja: `'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, 'Noto Sans JP', ${CJK_FALLBACK}, sans-serif`,
  en: `Inter, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, ${CJK_FALLBACK}, sans-serif`,
};

export default function AppShell() {
  const { user, settings, unreadAnnouncement, notifications } = useApp();
  const [phase, setPhase] = useState<'logo' | 'black' | 'app'>('logo');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [settling, setSettling] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  // 任何路由切换都回到顶部：真正的滚动容器是 main，而不是 window。
  // 用 rAF 再补一次，确保新页面挂载、布局稳定后仍停在顶部。
  useEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0);
      const main = mainRef.current;
      if (!main) return;
      main.scrollTop = 0;
      // 同时重置页面内部所有可滚动容器（很多页面是自己的 overflow-y-auto 在滚）
      main.querySelectorAll<HTMLElement>('*').forEach((el) => {
        const style = window.getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollTop !== 0) el.scrollTop = 0;
      });
    };
    reset();
    const raf = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  // 登录成功后强制回到主页：只在「未登录 → 已登录」这一刻跳转。
  // 初始值取当前登录态，这样刷新页面（会话恢复）不会误跳，只有真正登录/切换账号才回主页。
  const wasLoggedIn = useRef(!!user);
  useEffect(() => {
    const loggedIn = !!user;
    if (loggedIn && !wasLoggedIn.current) navigate('/', { replace: true });
    wasLoggedIn.current = loggedIn;
  }, [user, navigate]);

  type PopNotif = { text: string; kind: string };
  const [toast, setToast] = useState<PopNotif | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const prevNotifCount = useRef(notifications.length);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const theme = settings.theme ?? 'dark';
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme !== 'system') document.documentElement.classList.add(`theme-${theme}`);
  }, [settings.theme]);

  // 自定义背景色：两侧氛围区跟随同一底色；并按底色亮度自动切换波点黑/白。
  // 不设自定义色时移除变量，回退到主题背景色 / 主题前景色（本来就是亮暗自适应）。
  useEffect(() => {
    const root = document.documentElement;
    if (settings.bgColor) {
      root.style.setProperty('--app-bg', settings.bgColor);
      const hex = settings.bgColor.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      const lightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      root.style.setProperty('--dot-tint', lightness > 0.5 ? '#000000' : '#ffffff');
    } else {
      root.style.removeProperty('--app-bg');
      root.style.removeProperty('--dot-tint');
    }
  }, [settings.bgColor]);

  // 语言切换 → 全套 UI 字体跟随（含 portal 弹层，因为它们挂在 body 上继承 --font-sans）
  useEffect(() => {
    const lang: Lang = settings.lang ?? 'zh';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en';
    const stack = settings.font
      ? `'${settings.font}', ${LANG_FONT_STACK[lang]}`
      : LANG_FONT_STACK[lang];
    document.documentElement.style.setProperty('--font-sans', stack);
    document.documentElement.style.fontFamily = stack;
    document.body.style.fontFamily = stack;
  }, [settings.lang, settings.font]);

  useEffect(() => {
    if (notifications.length > prevNotifCount.current) {
      const latest = notifications[notifications.length - 1];
      setToast({ text: latest.text, kind: latest.kind });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
      prevNotifCount.current = notifications.length;
    } else {
      prevNotifCount.current = notifications.length;
    }
  }, [notifications]);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch('/wl-lunch-app/?_=' + Date.now(), { cache: 'no-store' });
        const html = await res.text();
        const match = html.match(/assets\/index-([\w-]+)\.js/);
        if (match) {
          const liveHash = match[1];
          const curScript = document.querySelector('script[src*="assets/index-"]')?.getAttribute('src') || '';
          if (!curScript.includes(liveHash)) setUpdateAvailable(true);
        }
      } catch {}
    };
    const t0 = setTimeout(checkUpdate, 3000);
    const t1 = setInterval(checkUpdate, 60000);
    return () => { clearTimeout(t0); clearInterval(t1); };
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('black'), 1200);
    const t2 = setTimeout(() => setPhase('app'), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setSettling(false);
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setParallax({ x, y });
    };
    const settle = () => {
      setSettling(true);
      setParallax({ x: 0, y: 0 });
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      setSettling(false);
      const t = e.touches[0];
      setParallax({ x: (t.clientX / window.innerWidth - 0.5) * 16, y: (t.clientY / window.innerHeight - 0.5) * 16 });
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', settle);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', settle);
    window.addEventListener('touchcancel', settle);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', settle);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', settle);
      window.removeEventListener('touchcancel', settle);
    };
  }, [settings.parallax]);

  if (phase !== 'app') {
    const blackIn = phase === 'black';
    return (
      <div
        className="dots-bg flex h-full flex-col items-center justify-center bg-background transition-opacity duration-700"
        style={{ opacity: blackIn ? 0 : 1 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Lunch Company"
          className="anim-pop w-64 max-w-[80vw] rounded-2xl shadow-2xl"
          style={{ animationDuration: '0.8s' }}
        />
        <p className="anim-pop mt-4 text-sm font-bold tracking-widest text-muted-foreground">WL Lunch</p>
        <div
          className="pointer-events-none fixed inset-0 bg-black transition-opacity duration-700"
          style={{ opacity: blackIn ? 1 : 0 }}
        />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const nav = [
    { to: '/', icon: Home, key: 'home', end: true },
    { to: '/leaderboard', icon: Trophy, key: 'leaderboard', end: false },
    { to: '/dishes', icon: UtensilsCrossed, key: 'dishes', end: false },
    { to: '/me', icon: UserRound, key: 'me', end: false },
  ];

  return (
    <div
      className={cn(
        'dots-bg app-frame relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden',
        settings.frosted && 'frosted-on',

        (settings.theme ?? 'dark') === 'dark' && 'theme-dark',
        (settings.theme ?? 'dark') === 'light' && 'theme-light',
      )}
      style={{
        backgroundColor: settings.bgColor || undefined,
        color: settings.textColor || undefined,
        fontFamily: settings.font
          ? `'${settings.font}', ${LANG_FONT_STACK[settings.lang ?? 'zh']}`
          : LANG_FONT_STACK[settings.lang ?? 'zh'],
        ['--primary' as string]: settings.accent || undefined,
        ['--ring' as string]: settings.accent || undefined,
        ['--card-alpha' as string]: `${Math.round(settings.opacity * 100)}%`,
        ['--card' as string]: settings.theme === 'dark' ? '#2a2a2a' : undefined,
      }}
    >
      {settings.bgImage && (
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `url(${settings.bgImage}) center/cover no-repeat`,
            transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.15)`,
            filter: settings.bgBlur ? `blur(${settings.bgBlur}px)` : undefined,
            transition: settling ? 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        />
      )}

      {/* 跟随鼠标的金色光晕（无背景图时也有） */}
      {!settings.bgImage && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${settings.accent || '#E8B923'}, transparent 70%)`,
              transform: `translate(${parallax.x * 2}px, ${parallax.y * 2}px)`,
              transition: settling ? 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #fff, transparent 70%)',
              transform: `translate(${-parallax.x * 2}px, ${-parallax.y * 2}px)`,
              transition: settling ? 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}
          />
        </div>
      )}

      {/* 微信风格新消息弹窗：从顶部滑入，点头像/卡片跳转对应页面 */}
      {toast && (() => {
        const meta: Record<string, { icon: string; title: string; color: string }> = {
          like: { icon: '❤️', title: '点赞消息', color: 'bg-rose-500' },
          reply: { icon: '💬', title: '评论回复', color: 'bg-sky-500' },
          admin: { icon: '📢', title: '管理员通知', color: 'bg-emerald-500' },
          feedback: { icon: '📬', title: '反馈回复', color: 'bg-violet-500' },
        };
        const m = meta[toast.kind] || { icon: '🔔', title: '新消息', color: 'bg-primary' };
        const target = toast.kind === 'feedback' ? '/feedback' : toast.kind === 'admin' ? '/announcements' : '/me';
        return (
          <div
            className="wx-notif fixed left-1/2 top-2 z-[260] w-[94%] max-w-md -translate-x-1/2 cursor-pointer"
            onClick={() => { navigate(target); setToast(null); }}
          >
            <div className="flex items-center gap-3 rounded-2xl bg-card/95 px-3.5 py-3 shadow-2xl ring-1 ring-black/10 backdrop-blur-md">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-white ${m.color}`}>
                {m.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black">{m.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">刚刚</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{toast.text}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-primary">点击查看 ›</span>
            </div>
          </div>
        );
      })()}

      <main ref={mainRef} className="relative flex-1 overflow-y-auto pb-40">
        <div key={location.pathname} className="anim-page">
          <Outlet />
        </div>
      </main>

      {/* 顶部高斯模糊渐变（限制在手机卡片内） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[250] h-10 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }} />
      {/* 底部高斯模糊渐变（限制在手机卡片内） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[250] h-10 backdrop-blur-[2px]" style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />

      {/* 液态玻璃浮窗底栏：扁长药丸 */}
      <nav
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        className={cn(
          'absolute left-1/2 z-[300] flex w-[92%] max-w-[420px] -translate-x-1/2 items-center justify-between gap-1 rounded-full p-1.5',
          'shadow-lg ring-1 ring-black/10 backdrop-blur-xl',
          settings.frosted ? 'card-glass' : 'card-solid',
        )}
      >
        {nav.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            onClick={() => {
              if (settings.scrollTopOnTab !== false) {
                requestAnimationFrame(() => {
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                });
              }
            }}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-xs font-medium transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute inset-0 rounded-full bg-primary/15 transition-all duration-300',
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                  )}
                />
                <span className="relative flex items-center gap-0.5">
                  <item.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={cn('relative text-[11px] leading-tight', isActive && 'font-bold')}>
                  {t(settings.lang, item.key)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底栏上方浅渐变融合 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20"
        style={{
          background: 'linear-gradient(to top, color-mix(in oklab, var(--card) 60%, transparent), transparent)',
        }}
      />

      {unreadAnnouncement && <AnnouncePopup announcement={unreadAnnouncement} />}
    </div>
  );
}
