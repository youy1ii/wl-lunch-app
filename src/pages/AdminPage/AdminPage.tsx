import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, FileText, UtensilsCrossed, Users, Megaphone,
  BellRing, Images, Pin, QrCode, Mail, Sparkles, Ticket, Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { isOwnerUser } from '@/lib/utils';

interface Entry {
  to: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
  ownerOnly?: boolean;
}

interface Group {
  title: string;
  items: Entry[];
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { settings, user } = useApp();
  const isOwner = isOwnerUser(user);

  const lang = settings.lang;
  const groups: Group[] = [
    {
      title: t(lang, 'admDataReport'),
      items: [
        { to: '/admin/report', icon: FileText, label: t(lang, 'admReport'), desc: t(lang, 'admReportDesc'), color: '#E8B923' },
        { to: '/dish-admin', icon: UtensilsCrossed, label: t(lang, 'adminDishes'), desc: t(lang, 'admDishesDesc'), color: '#5B8C5A' },
        { to: '/user-management', icon: Users, label: t(lang, 'admUsers'), desc: t(lang, 'admUsersDesc'), color: '#38B6FF' },
        { to: '/feedback-inbox', icon: Mail, label: t(lang, 'feedbackInbox'), desc: t(lang, 'admFeedbackDesc'), color: '#8B5CF6' },
      ],
    },
    {
      title: t(lang, 'admContentOps'),
      items: [
        { to: '/admin/announcements', icon: Megaphone, label: t(lang, 'admAnnounce'), desc: t(lang, 'admAnnounceDesc'), color: '#F97316' },
        { to: '/admin/ticker', icon: BellRing, label: t(lang, 'admTicker'), desc: t(lang, 'admTickerDesc'), color: '#C13584' },
        { to: '/admin/banner', icon: Images, label: t(lang, 'adminBanner'), desc: t(lang, 'admBannerDesc'), color: '#8B5CF6' },
        { to: '/admin/pinned', icon: Pin, label: t(lang, 'admPinned'), desc: t(lang, 'admPinnedDesc'), color: '#EF4444' },
        { to: '/admin/tips', icon: QrCode, label: t(lang, 'adminTips'), desc: t(lang, 'admTipsDesc'), color: '#10B981' },
        { to: '/admin/dm', icon: Send, label: t(lang, 'admDm'), desc: t(lang, 'admDmDesc'), color: '#6366F1' },
      ],
    },
    {
      title: t(lang, 'admAdvanced'),
      items: [
        { to: '/admin/frames', icon: Sparkles, label: t(lang, 'admFrames'), desc: t(lang, 'admFramesDesc'), color: '#6366F1' },
        { to: '/admin/invite', icon: Ticket, label: t(lang, 'admInvite'), desc: t(lang, 'admInviteDesc'), color: '#0EA5E9', ownerOnly: true },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3.5 shadow-sm">
        <button type="button" onClick={() => navigate(-1)} className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-muted" aria-label={t(lang, 'admBack')}>
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black leading-tight">{t(settings.lang, 'admin')}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, 'admSubtitle')}</p>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
        {groups.map((g) => {
          const items = g.items.filter((it) => !it.ownerOnly || isOwner);
          if (items.length === 0) return null;
          return (
            <section key={g.title}>
              <h2 className="mb-3 px-1 text-sm font-bold text-muted-foreground">{g.title}</h2>
              <div className="card-solid overflow-hidden rounded-2xl shadow-sm">
                {items.map((it, idx) => (
                  <button
                    key={it.to}
                    type="button"
                    onClick={() => navigate(it.to)}
                    className={`pressable flex w-full items-center gap-4 px-4 py-4 text-left ${idx < items.length - 1 ? 'border-b border-border/60' : ''}`}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                      style={{ background: `${it.color}22`, color: it.color }}
                    >
                      <it.icon size={23} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-black">{it.label}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{it.desc}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        <p className="pb-4 text-center text-xs text-muted-foreground/60">{t(lang, 'admFooter')}</p>
      </div>
    </div>
  );
}
