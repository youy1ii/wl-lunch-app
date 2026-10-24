import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Trophy, UtensilsCrossed, UserRound } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import LoginPage from '@/pages/LoginPage/LoginPage';
import AnnouncePopup from '@/components/AnnouncePopup';
import { cn } from '@/lib/utils';

export default function AppShell() {
  const { user, settings, unreadAnnouncement, notifications } = useApp();
  const [phase, setPhase] = useState<'logo' | 'black' | 'app'>('logo');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [settling, setSettling] = useState(false);
  const location = useLocation();
  const [toast, setToast] = useState<string | null>(null);
  const prevNotifCount = useRef(notifications.length);

  useEffect(() => {
    const theme = settings.theme ?? 'light';
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme !== 'system') document.documentElement.classList.add(`theme-${theme}`);
  }, [settings.theme]);

  useEffect(() => {
    if (notifications.length > prevNotifCount.current) {
      const latest = notifications[notifications.length - 1];
      setToast(latest.text);
      setTimeout(() => setToast(null), 4000);
      prevNotifCount.current = notifications.length;
    } else {
      prevNotifCount.current = notifications.length;
    }
  }, [notifications]);

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
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', settle);
    window.addEventListener('touchend', settle);
    window.addEventListener('touchcancel', settle);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', settle);
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
          src="/logo.png"
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
        'dots-bg relative mx-auto flex h-full max-w-md flex-col overflow-hidden',
        settings.frosted && 'frosted-on',

        (settings.theme ?? 'light') === 'dark' && 'theme-dark',
        (settings.theme ?? 'light') === 'light' && 'theme-light',
      )}
      style={{
        background: settings.bgColor || undefined,
        color: settings.textColor || undefined,
        fontFamily: settings.font ? `'${settings.font}', sans-serif` : undefined,
        ['--primary' as string]: settings.accent || undefined,
        ['--ring' as string]: settings.accent || undefined,
        ['--card-alpha' as string]: `${Math.round(settings.opacity * 100)}%`,
        ['--card' as string]: settings.theme === 'dark' ? '#2a2a2a' : undefined,
      }}
    >
      {settings.bgImage && (
        <div
          className="pointer-events-none fixed inset-0 -z-10"
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
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
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

      {/* 新通知顶部横幅 */}
      {toast && (
        <div className="fixed left-1/2 top-3 z-[200] w-[92%] max-w-md -translate-x-1/2 anim-pop">
          <div className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-xl">
            🔔 {toast}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-32">
        <div key={location.pathname} className="anim-page">
          <Outlet />
        </div>
      </main>

      {/* 液态玻璃浮窗底栏：扁长药丸 */}
      <nav
        className={cn(
          'absolute bottom-3 left-1/2 z-30 flex w-[92%] max-w-sm -translate-x-1/2 items-center justify-between gap-0.5 rounded-full p-1',
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
                'relative flex flex-1 flex-col items-center gap-0 rounded-full px-2 py-1 text-[10px] font-medium transition-all duration-300',
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
                  <item.icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={cn('relative text-[9px] leading-tight', isActive && 'font-bold')}>
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
