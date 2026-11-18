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

  const groups: Group[] = [
    {
      title: '数据与报告',
      items: [
        { to: '/admin/report', icon: FileText, label: '总结报告', desc: '食堂口碑简报 · 导出 PDF', color: '#E8B923' },
        { to: '/dish-admin', icon: UtensilsCrossed, label: '菜品管理', desc: '添加菜品 · 上下架 · 新品', color: '#5B8C5A' },
        { to: '/user-management', icon: Users, label: '用户管理', desc: '封禁用户 · 定向私信', color: '#38B6FF' },
        { to: '/feedback-inbox', icon: Mail, label: '反馈信箱', desc: '查看并处理学生反馈', color: '#8B5CF6' },
      ],
    },
    {
      title: '内容运营',
      items: [
        { to: '/admin/announcements', icon: Megaphone, label: '公告管理', desc: '发布公告 · 强制弹窗', color: '#F97316' },
        { to: '/admin/ticker', icon: BellRing, label: '滚动通知', desc: '首页常驻小喇叭', color: '#C13584' },
        { to: '/admin/banner', icon: Images, label: 'Banner 轮播', desc: '海报图 · 跳转链接', color: '#8B5CF6' },
        { to: '/admin/pinned', icon: Pin, label: '置顶公告', desc: '评论区顶部固定显示', color: '#EF4444' },
        { to: '/admin/tips', icon: QrCode, label: '赞赏码', desc: '学生打赏收款码', color: '#10B981' },
        { to: '/admin/dm', icon: Send, label: '私信广播', desc: '给全体或指定学生发消息', color: '#6366F1' },
      ],
    },
    {
      title: '高级设置',
      items: [
        { to: '/admin/frames', icon: Sparkles, label: '头像框管理', desc: '上传 · 颁发 · 兑换码', color: '#6366F1' },
        { to: '/admin/invite', icon: Ticket, label: '管理员邀请码', desc: '生成一次性邀请码', color: '#0EA5E9', ownerOnly: true },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button type="button" onClick={() => navigate(-1)} className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-muted" aria-label="返回">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black leading-tight">{t(settings.lang, 'admin')}</h1>
          <p className="text-xs text-muted-foreground">管理后台 · 所有功能</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {groups.map((g) => {
          const items = g.items.filter((it) => !it.ownerOnly || isOwner);
          if (items.length === 0) return null;
          return (
            <section key={g.title}>
              <h2 className="mb-2 px-1 text-xs font-bold text-muted-foreground">{g.title}</h2>
              <div className="card-solid overflow-hidden rounded-2xl shadow-sm">
                {items.map((it, idx) => (
                  <button
                    key={it.to}
                    type="button"
                    onClick={() => navigate(it.to)}
                    className={`pressable flex w-full items-center gap-3.5 px-4 py-3.5 text-left ${idx < items.length - 1 ? 'border-b border-border/60' : ''}`}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: `${it.color}22`, color: it.color }}
                    >
                      <it.icon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">{it.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{it.desc}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        <p className="pb-4 text-center text-[11px] text-muted-foreground/60">WL Lunch 管理后台</p>
      </div>
    </div>
  );
}
