import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  MessageSquare,
  Heart,
  Palette,
  Globe,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
  Bell,
  UserRound,
  Mail,
  UtensilsCrossed,
  Trash2,
  MessageCircle,
  UserMinus,
} from 'lucide-react';
import { cn, isOwnerUser } from '@/lib/utils';
import CropModal from '@/components/CropModal';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { TIERS } from '@/lib/mock-data';
import type { Lang } from '@/lib/types';

// 隐私开关项：草稿态与保存共用同一份定义
const PRIVACY_ITEMS = [
  { key: 'showRealInfo', label: { zh: '展示真实姓名', ja: '本名を表示', en: 'Show real name' }, def: false },
  { key: 'showClass', label: { zh: '展示班级', ja: 'クラスを表示', en: 'Show class' }, def: false },
  { key: 'showStudentId', label: { zh: '展示学号', ja: '学籍番号を表示', en: 'Show student ID' }, def: false },
  { key: 'showGrade', label: { zh: '展示年级', ja: '学年を表示', en: 'Show grade' }, def: false },
  { key: 'showFollowers', label: { zh: '别人可见我的粉丝列表', ja: 'フォワラー一覧を公開', en: 'Show my followers' }, def: true },
  { key: 'showFollowing', label: { zh: '别人可见我的关注列表', ja: 'フォロー一覧を公開', en: 'Show my following' }, def: true },
] as const;

export default function MePage() {
  const { user, isAdmin, settings, setSettings, logout, dishes, followees, updateUserProfile, deleteReview, toggleFollow, frames, myFrameId, setActiveFrame, profileHeader, setHeaderImage, feedbacks, replyFeedback, savedAccounts, switchAccount, redeemFrameCode } = useApp();
  const navigate = useNavigate();
  const [showMine, setShowMine] = useState(false);
  const [actionReview, setActionReview] = useState<{ dishId: number; reviewId: number; dishName: string } | null>(null);
  const [confirmDelReview, setConfirmDelReview] = useState<{ dishId: number; reviewId: number } | null>(null);
  const [actionFollow, setActionFollow] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2000); };
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  // 弹层草稿：点确认才写入，避免 onBlur/勾选即生效
  const [nickDraft, setNickDraft] = useState('');
  const [bioDraft2, setBioDraft2] = useState('');
  const [privacyDraft, setPrivacyDraft] = useState<Record<string, boolean>>({});
  const [notifOn, setNotifOn] = useState(true);
  const [showFrames, setShowFrames] = useState(false);
  const [cropImg, setCropImg] = useState<string>('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'header'>('avatar');
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [frameCode, setFrameCode] = useState('');
  const isOwner = isOwnerUser(user);
  const hasAdminAccess = isAdmin || isOwner;
  const effectiveFrameId = myFrameId || (isOwner ? 'beta' : isAdmin ? 'gold' : '');
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const fileRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setCropImg(reader.result as string); setCropTarget('avatar'); setCropZoom(1); };
    reader.readAsDataURL(f);
  };

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateUserProfile({ avatar: reader.result as string }).then((ok) => {
        showToast(ok ? '头像上传成功' : 'PRTS代理指挥失败。请检查网络再次尝试');
      });
    };
    reader.readAsDataURL(file);
  };
  const onPickHeader = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHeaderImage(reader.result as string);
    reader.readAsDataURL(file);
  };
  const myReviews = dishes.flatMap((d) =>
    d.reviews.filter((r) => r.mine).map((r) => ({ dish: d, review: r })),
  );
  const myCount = myReviews.length;

  const rows = [
    { icon: Megaphone, label: t(settings.lang, 'announcements'), to: '/announcements' },
    { icon: MessageSquare, label: t(settings.lang, 'feedback'), to: '/feedback' },
    { icon: Heart, label: t(settings.lang, 'tips'), to: '/tips' },
    { icon: Palette, label: t(settings.lang, 'appearance'), to: '/appearance' },
    ...(hasAdminAccess ? [{ icon: Shield, label: t(settings.lang, 'admin'), to: '/admin' }] : []),
    ...(hasAdminAccess ? [{ icon: Mail, label: t(settings.lang, 'feedbackInbox'), to: '/feedback-inbox', badge: pendingCount }] : []),
    ...(hasAdminAccess ? [{ icon: UtensilsCrossed, label: t(settings.lang, 'adminDishes'), to: '/dish-admin' }] : []),
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {/* 网易云风居中头像 */}
      <div className="anim-rise flex flex-col items-center pt-6">
        <div className="relative">
          {/* 顶图背景 */}
          {profileHeader && (
            <img src={profileHeader} alt="" className="absolute -top-16 left-1/2 h-20 w-32 -translate-x-1/2 rounded-xl object-cover opacity-60" />
          )}
          <div
            className={
              effectiveFrameId === 'gold'
                ? 'rounded-full p-1 bg-amber-400 shadow-[0_0_18px_4px_rgba(251,191,36,0.85),0_0_38px_10px_rgba(251,191,36,0.5),0_0_60px_18px_rgba(251,191,36,0.25)]'
                : effectiveFrameId === 'rainbow'
                  ? 'rounded-full p-1 shadow-xl'
                  : effectiveFrameId === 'beta'
                    ? 'rounded-full p-1 bg-emerald-400 shadow-[0_0_18px_4px_rgba(52,211,153,0.95),0_0_38px_10px_rgba(52,211,153,0.6),0_0_60px_18px_rgba(52,211,153,0.3)]'
                    : 'p-1'
            }
            style={effectiveFrameId === 'rainbow' ? { background: 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' } : undefined}
          >
          <label className="pressable flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-4xl">
            {user?.avatar?.startsWith('data:') ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.avatar ?? user?.realName?.slice(0, 1) ?? '?'
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          </label>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-lg font-black">
          {user?.nickname || user?.username}
          {(isAdmin || isOwner) && (
            <span className={
              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black shadow-sm " +
              (isOwner ? "bg-emerald-500 text-white shadow-emerald-400/50" : "bg-amber-500 text-white shadow-amber-400/50")
            }>
              {isOwner ? '总管理员' : '管理员'}
            </span>
          )}
        </div>
        <button type="button" className="pressable mt-0.5 text-[10px] text-muted-foreground" onClick={() => { if (user?.uid) { navigator.clipboard.writeText(user.uid); showToast("UID已复制"); } }}>UID: {user?.uid}</button>
        <div className="mt-1 text-xs text-muted-foreground">
          {user?.role === 'student' ? `${user.grade ?? ''}${user.klass ?? ''}学生` : (isOwner ? '总管理员' : '管理员')}
        </div>
        <div className="mt-4 flex items-center gap-6 text-center">
          <button type="button" className="pressable" onClick={() => setShowFollowing(true)}>
            <div className="text-lg font-black">{followees.length}</div>
            <div className="text-[10px] text-muted-foreground">关注</div>
          </button>
          <div className="h-6 w-px bg-border" />
          <button type="button" className="pressable" onClick={() => setShowFollowers(true)}>
            <div className="text-lg font-black">0</div>
            <div className="text-[10px] text-muted-foreground">粉丝</div>
          </button>
          <div className="h-6 w-px bg-border" />
          <button type="button" className="pressable" onClick={() => setShowMine(true)}>
            <div className="text-lg font-black">{myCount}</div>
            <div className="text-[10px] text-muted-foreground">评价</div>
          </button>
        </div>

        {/* 个性签名 */}
        <button
          type="button"
          onClick={() => {
            const b = window.prompt('个性签名（最多200字，可换行）', user?.bio ?? '');
            if (b !== null) { updateUserProfile({ bio: b.slice(0, 200) }); showToast('个性签名已保存'); }
          }}
          className="pressable mt-3 line-clamp-2 max-w-[260px] whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {user?.bio || '点这里写个性签名...'}
        </button>
      </div>

      {/* 我的评价弹层 */}
      {showMine && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowMine(false)}>
          <div
            className="anim-rise card-solid max-h-[75%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">我的评价（{myCount}）</h3>
              <button type="button" onClick={() => setShowMine(false)} className="pressable rounded-full bg-muted p-1">
                <X size={16} />
              </button>
            </div>
            {myReviews.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">还没打过分，去首页挑一道菜试试</p>}
            {myReviews.map(({ dish, review }) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setActionReview({ dishId: dish.id, reviewId: review.id, dishName: dish.name })}
                className="pressable mb-2 w-full rounded-xl bg-muted p-3 text-left text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{dish.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: TIERS[review.tier - 1].color }}
                  >
                    {TIERS[review.tier - 1].label}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{review.text}</p>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}

      {showFollowers && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowFollowers(false)}>
          <div className="anim-rise card-solid max-h-[75%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">粉丝</h3>
              <button type="button" onClick={() => setShowFollowers(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <p className="py-8 text-center text-xs text-muted-foreground">还没有粉丝，多去评论区互动吧</p>
          </div>
        </div>,
        document.body,
      )}

      {showFollowing && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowFollowing(false)}>
          <div className="anim-rise card-solid max-h-[75%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">关注</h3>
              <button type="button" onClick={() => setShowFollowing(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            {followees.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">还没有关注任何人</p> : followees.map(u => (
              <button key={u} type="button" onClick={() => setActionFollow(u)} className="pressable mb-2 flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left text-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">{u.slice(0, 1).toUpperCase()}</span>
                <span className="flex-1 font-bold">{u}</span>
                <ChevronRight size={15} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
      {/* 评价操作卡：前往菜品评论区 / 删除 */}
      {actionReview && createPortal(
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-black/50" onClick={() => setActionReview(null)}>
          <div className="anim-rise w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-center text-sm font-black">{actionReview.dishName}</div>
            <button
              type="button"
              onClick={() => { const id = actionReview.dishId; setActionReview(null); setShowMine(false); navigate(`/dishes/${id}`); }}
              className="pressable mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              <MessageCircle size={17} /> 前往菜品评论区
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelReview({ dishId: actionReview.dishId, reviewId: actionReview.reviewId }); setActionReview(null); }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-bold text-destructive"
            >
              <Trash2 size={17} /> 删除评价
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 删除评价二次确认 */}
      {confirmDelReview && createPortal(
        <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/60 p-6" onClick={() => setConfirmDelReview(null)}>
          <div className="anim-pop card-solid w-full max-w-xs rounded-2xl p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Trash2 size={22} /></div>
            <div className="text-sm font-black">{t(settings.lang, 'deleteReviewConfirm')}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">删除后不可恢复</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmDelReview(null)} className="pressable flex-1 rounded-xl bg-muted py-2.5 text-sm font-bold">{t(settings.lang, 'cancel')}</button>
              <button
                type="button"
                onClick={() => {
                  const { dishId, reviewId } = confirmDelReview!;
                  setConfirmDelReview(null);
                  deleteReview(dishId, reviewId).then((ok) => {
                    showToast(ok ? '评价已删除' : 'PRTS代理指挥失败。请检查网络再次尝试');
                  });
                }}
                className="pressable flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destruct-foreground"
              >
                {t(settings.lang, 'confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 关注操作卡：取消关注 */}
      {actionFollow && createPortal(
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-black/50" onClick={() => setActionFollow(null)}>
          <div className="anim-rise w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-foreground">{actionFollow.slice(0, 1).toUpperCase()}</span>
              <span className="text-sm font-black">{actionFollow}</span>
            </div>
            <button
              type="button"
              onClick={() => { const name = actionFollow; setActionFollow(null); toggleFollow(name); showToast('已取消关注 ' + name); }}
              className="pressable flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-bold text-destructive"
            >
              <UserMinus size={17} /> 取消关注
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 编辑资料 / 隐私设置 */}
      <div className="card-solid mt-5 overflow-hidden rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={() => { setNickDraft(user?.nickname ?? ''); setBioDraft2(user?.bio ?? ''); setShowEdit(true); }}
          className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left"
        >
          <UserRound size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">{t(settings.lang, 'editProfile')}</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => {
            const d: Record<string, boolean> = {};
            PRIVACY_ITEMS.forEach((it) => { d[it.key] = (user as any)?.[it.key] ?? it.def; });
            setPrivacyDraft(d);
            setShowPrivacy(true);
          }}
          className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left"
        >
          <ShieldCheck size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">{t(settings.lang, 'privacySettings')}</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5">
          <Bell size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">{t(settings.lang, 'notifications')}</span>
          <input type="checkbox" checked={notifOn} onChange={(e) => setNotifOn(e.target.checked)} />
        </div>
      </div>

      <div className="card-solid mt-3 overflow-hidden rounded-2xl shadow-sm">
        {rows.map((row, idx) => (
          <button
            key={row.label + idx}
            type="button"
            onClick={() => { if (row.to) navigate(row.to); }}
            className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0"
          >
            <row.icon size={18} className="text-muted-foreground" />
            <span className="flex-1 text-sm">{row.label}</span>
            {row.badge ? (<span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destruct-foreground">{row.badge > 99 ? '99+' : row.badge}</span>) : null}
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
        <div className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5">
          <Globe size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">{t(settings.lang, 'language')}</span>
          {(['zh', 'ja', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setSettings({ lang: l })}
              className={`rounded-full px-2.5 py-1 text-xs font-bold pressable ${
                settings.lang === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑资料弹层 */}
      {showEdit && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowEdit(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">{t(settings.lang, 'editProfile')}</h3>
              <button type="button" onClick={() => setShowEdit(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">{t(settings.lang, 'nickname')}</label>
            <input
              value={nickDraft}
              onChange={(e) => setNickDraft(e.target.value)}
              placeholder={t(settings.lang, 'nickname')}
              className="mb-3 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
            />
            <label className="mb-1 block text-xs font-bold text-muted-foreground">{t(settings.lang, 'bioEdit')}</label>
            <input
              value={bioDraft2}
              onChange={(e) => setBioDraft2(e.target.value)}
              placeholder={t(settings.lang, 'editBio')}
              className="mb-3 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => { setShowEdit(false); setShowFrames(true); }}
              className="mt-1 w-full rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary pressable"
            >
              ✨ {t(settings.lang, 'avatarFrame')}
            </button>
            <p className="mt-2 text-[10px] text-muted-foreground">{t(settings.lang, 'uploadAvatar')}</p>
            <button
              type="button"
              onClick={() => {
                updateUserProfile({ nickname: nickDraft, bio: bioDraft2 });
                setShowEdit(false);
                showToast(t(settings.lang, 'saved'));
              }}
              className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground pressable"
            >
              {t(settings.lang, 'confirm')}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 隐私设置弹层 */}
      {showPrivacy && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowPrivacy(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">{t(settings.lang, 'privacySettings')}</h3>
              <button type="button" onClick={() => setShowPrivacy(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            {PRIVACY_ITEMS.map((item) => (
              <label key={item.key} className="mb-2 flex items-center justify-between text-sm">
                {item.label[settings.lang]}
                <input
                  type="checkbox"
                  checked={privacyDraft[item.key] ?? item.def}
                  onChange={(e) => setPrivacyDraft({ ...privacyDraft, [item.key]: e.target.checked })}
                />
              </label>
            ))}
            <p className="mt-2 text-[10px] text-muted-foreground">{settings.lang === 'zh' ? '真实信息默认隐藏，粉丝/关注列表默认公开' : settings.lang === 'ja' ? '実情報は非公開、フォロー一覧は公開が初期設定です' : 'Real info hidden by default; followers/following public by default'}</p>
            <button
              type="button"
              onClick={() => {
                updateUserProfile(privacyDraft as any);
                setShowPrivacy(false);
                showToast(t(settings.lang, 'saved'));
              }}
              className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground pressable"
            >
              {t(settings.lang, 'confirm')}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 头像框选择弹层 */}
      {showFrames && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowFrames(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">✨ 头像框装扮</h3>
              <button type="button" onClick={() => setShowFrames(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <div className="mb-3 flex gap-2">
              <input
                value={frameCode}
                onChange={(e) => setFrameCode(e.target.value.toUpperCase())}
                placeholder="输入兑换码"
                className="flex-1 rounded-xl bg-muted px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!frameCode.trim()) return;
                  const res = redeemFrameCode(frameCode.trim(), user?.username || '');
                  showToast(res.msg);
                  if (res.ok) setFrameCode('');
                }}
                className="pressable rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                兑换
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {frames.map((fr) => {
                const owned = fr.issuedTo.includes(user?.username ?? '');
                const active = effectiveFrameId === fr.id;
                return (
                  <button
                    key={fr.id}
                    type="button"
                    onClick={() => {
                      if (owned) { setActiveFrame(fr.id); setShowFrames(false); }
                      else alert(`🔒 ${fr.name}\n${fr.unlockText}`);
                    }}
                    className="pressable flex flex-col items-center gap-1 rounded-2xl bg-muted p-3"
                  >
                    <div
                      className={
                        'flex h-14 w-14 items-center justify-center rounded-full text-xl ' +
                        (fr.id === 'gold' ? 'ring-4 ring-amber-400' :
                         fr.id === 'rainbow' ? 'ring-4' :
                         fr.id === 'beta' ? 'ring-4 ring-emerald-400' : '') +
                        (!owned ? ' opacity-40 grayscale' : '')
                      }
                      style={fr.id === 'rainbow' ? { background: 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' } : undefined}
                    >
                      {owned ? (active ? '✅' : '🎁') : '🔒'}
                    </div>
                    <div className="text-[10px] font-bold">{fr.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 裁剪弹层 */}
      {cropImg && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setCropImg('')}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-center text-sm font-bold text-white">拖动调整位置，滚轮缩放</p>
            <div className="relative mx-auto overflow-hidden rounded-full" style={{ width: 200, height: 200 }}>
              <img
                src={cropImg}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
                style={{ width: 200 * cropZoom, height: 200 * cropZoom }}
              />
            </div>
            <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="mt-4 w-full" />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCropImg('')} className="flex-1 rounded-full bg-white/20 py-2 text-sm font-bold text-white">取消</button>
              <button
                type="button"
                onClick={() => {
                  // simple: just use the original with zoom implied via CSS
                  if (cropTarget === 'avatar') updateUserProfile({ avatar: cropImg });
                  else setHeaderImage(cropImg);
                  setCropImg('');
                }}
                className="flex-1 rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                确认
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 个性签名编辑弹层 */}
      {showBioEdit && createPortal(
        <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/50" onClick={() => setShowBioEdit(false)}>
          <div className="anim-rise w-full max-w-md rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">个性签名</h3>
              <button type="button" onClick={() => setShowBioEdit(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value.slice(0, 200))}
              rows={4}
              placeholder="写点什么..."
              className="w-full rounded-xl bg-muted p-3 text-sm outline-none"
            />
            <div className="mb-3 text-right text-[10px] text-muted-foreground">{bioDraft.length}/200</div>
            <button
              type="button"
              onClick={() => { updateUserProfile({ bio: bioDraft }); setShowBioEdit(false); }}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground pressable"
            >
              保存
            </button>
          </div>
        </div>,
        document.body,
      )}

      {hasAdminAccess && (
      <button
        type="button"
        onClick={() => setShowSwitchAccount(true)}
        className="card-solid pressable mt-4 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-destructive shadow-sm ring-1 ring-destructive/20"
      >
        <LogOut size={16} />
        {t(settings.lang, 'switchAccount')} / {t(settings.lang, 'logout')}
      </button>
      )}

      {showSwitchAccount && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50" onClick={() => setShowSwitchAccount(false)}>
          <div className="anim-rise card-solid w-full max-w-md rounded-t-3xl p-5" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-center text-sm font-black">{t(settings.lang, 'switchAccount')}</h3>
            {savedAccounts.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{t(settings.lang, 'noSavedAccounts')}</p>}
            {savedAccounts.map((acc) => (
              <button key={acc.user.uid} type="button" onClick={() => { switchAccount(acc.user.uid || ''); setShowSwitchAccount(false); }} className="pressable mb-2 flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left">
                <div className={"flex h-10 w-10 items-center justify-center rounded-full text-sm font-black " + (acc.user.uid === '00000000' ? 'bg-emerald-400 glow-mint text-white' : acc.isAdmin ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary')}>
                  {acc.user.username?.slice(0, 1).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{acc.user.username}</div>
                  <div className="text-[10px] text-muted-foreground">UID: {acc.user.uid}</div>
                </div>
                {acc.user.uid === user?.uid && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{t(settings.lang, 'currentAccount')}</span>}
              </button>
            ))}
            <button type="button" onClick={() => { logout(); setShowSwitchAccount(false); }} className="pressable mt-2 w-full rounded-xl border border-border py-2.5 text-sm font-bold text-foreground">
              {t(settings.lang, 'registerNewAccount')}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 低调版权 */}
      <p className="mt-auto pb-4 pt-6 text-center text-[10px] leading-relaxed text-muted-foreground/60">
        本软件由上海市文来高中2026级同人社团 L Company 与 AI 融合开发
        <br />
        一切解释权归属文来
      </p>
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs font-bold text-white anim-pop">{toast}</div>
      )}
    </div>
  );
}
