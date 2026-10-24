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
} from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { TIERS } from '@/lib/mock-data';
import type { Lang } from '@/lib/types';

export default function MePage() {
  const { user, isAdmin, settings, setSettings, logout, dishes, followees, updateUserProfile, frames, myFrameId, setActiveFrame, profileHeader, setHeaderImage } = useApp();
  const navigate = useNavigate();
  const [showMine, setShowMine] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2000); };
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [showFrames, setShowFrames] = useState(false);
  const [cropImg, setCropImg] = useState<string>('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'header'>('avatar');
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
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
    reader.onload = () => { updateUserProfile({ avatar: reader.result as string }); showToast('头像上传成功'); };
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
    ...(isAdmin ? [{ icon: Shield, label: t(settings.lang, 'admin'), to: '/admin' }] : []),
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
              myFrameId === 'gold'
                ? 'rounded-full p-1 ring-4 ring-amber-400 shadow-amber-300/60 shadow-lg'
                : myFrameId === 'rainbow'
                  ? 'rounded-full p-1 shadow-lg'
                  : myFrameId === 'beta'
                    ? 'rounded-full p-1 ring-4 ring-emerald-400 shadow-emerald-300/60 shadow-lg'
                    : 'p-1'
            }
            style={myFrameId === 'rainbow' ? { background: 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' } : undefined}
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
        <div className="mt-3 flex items-center justify-center gap-2 text-lg font-black">{user?.realName ?? user?.username}{isAdmin && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">管理员</span>}</div>
        <button type="button" className="pressable mt-0.5 text-[10px] text-muted-foreground" onClick={() => { if (user?.uid) { navigator.clipboard.writeText(user.uid); showToast("UID已复制"); } }}>UID: {user?.uid}</button>
        <div className="mt-1 text-xs text-muted-foreground">
          {user?.role === 'student' ? `${user.grade ?? ''}${user.klass ?? ''}学生` : '管理员'}
        </div>
        <div className="mt-4 flex items-center gap-6 text-center">
          <div>
            <div className="text-lg font-black">{followees.length}</div>
            <div className="text-[10px] text-muted-foreground">关注</div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="text-lg font-black">{followees.length * 7 + 3}</div>
            <div className="text-[10px] text-muted-foreground">粉丝</div>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowMine(false)}>
          <div
            className="anim-rise card-solid max-h-[70%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5"
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
              <div key={review.id} className="mb-2 rounded-xl bg-muted p-3 text-xs">
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
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}

      {showFollowers && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowFollowers(false)}>
          <div className="anim-rise card-solid max-h-[70%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowFollowing(false)}>
          <div className="anim-rise card-solid max-h-[70%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">关注</h3>
              <button type="button" onClick={() => setShowFollowing(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            {followees.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">还没有关注任何人</p> : followees.map(u => <div key={u} className="mb-2 rounded-xl bg-muted p-3 text-xs">{u}</div>)}
          </div>
        </div>,
        document.body,
      )}
      {/* 编辑资料 / 隐私设置 */}
      <div className="card-solid mt-5 overflow-hidden rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left"
        >
          <UserRound size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">编辑资料</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => setShowPrivacy(true)}
          className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left"
        >
          <ShieldCheck size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">隐私设置</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <div className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5">
          <Bell size={18} className="text-muted-foreground" />
          <span className="flex-1 text-sm">通知提醒</span>
          <input type="checkbox" checked={notifOn} onChange={(e) => setNotifOn(e.target.checked)} />
        </div>
      </div>

      <div className="card-solid mt-3 overflow-hidden rounded-2xl shadow-sm">
        {rows.map((row) => (
          <button
            key={row.to}
            type="button"
            onClick={() => navigate(row.to)}
            className="pressable flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0"
          >
            <row.icon size={18} className="text-muted-foreground" />
            <span className="flex-1 text-sm">{row.label}</span>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowEdit(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">编辑资料</h3>
              <button type="button" onClick={() => setShowEdit(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">昵称</label>
            <input
              defaultValue={user?.realName ?? ''}
              onBlur={(e) => updateUserProfile({ realName: e.target.value })}
              className="mb-3 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
            />
            <label className="mb-1 block text-xs font-bold text-muted-foreground">个性签名</label>
            <input
              defaultValue={user?.bio ?? ''}
              onBlur={(e) => updateUserProfile({ bio: e.target.value })}
              placeholder="写点什么..."
              className="mb-3 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => { setShowEdit(false); setShowFrames(true); }}
              className="mt-3 w-full rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary pressable"
            >
              ✨ 头像框装扮
            </button>
            <p className="mt-2 text-[10px] text-muted-foreground">点头像可以上传图片</p>
          </div>
        </div>,
        document.body,
      )}

      {/* 隐私设置弹层 */}
      {showPrivacy && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowPrivacy(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">隐私设置</h3>
              <button type="button" onClick={() => setShowPrivacy(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            {[
              { key: 'showRealInfo', label: '展示真实姓名', def: false },
              { key: 'showClass', label: '展示班级', def: false },
              { key: 'showStudentId', label: '展示学号', def: false },
              { key: 'showGrade', label: '展示年级', def: false },
              { key: 'showFollowers', label: '别人可见我的粉丝列表', def: true },
              { key: 'showFollowing', label: '别人可见我的关注列表', def: true },
            ].map((item) => (
              <label key={item.key} className="mb-2 flex items-center justify-between text-sm">
                {item.label}
                <input
                  type="checkbox"
                  checked={(user?.[item.key] as boolean) ?? item.def}
                  onChange={(e) => updateUserProfile({ [item.key]: e.target.checked } as any)}
                />
              </label>
            ))}
            <p className="mt-2 text-[10px] text-muted-foreground">真实信息默认隐藏，粉丝/关注列表默认公开</p>
          </div>
        </div>,
        document.body,
      )}

      {/* 头像框选择弹层 */}
      {showFrames && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowFrames(false)}>
          <div
            className="anim-rise max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black">✨ 头像框装扮</h3>
              <button type="button" onClick={() => setShowFrames(false)} className="pressable rounded-full bg-muted p-1"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {frames.map((fr) => {
                const owned = fr.issuedTo.includes(user?.username ?? '');
                const active = myFrameId === fr.id;
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
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setShowBioEdit(false)}>
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

      <button
        type="button"
        onClick={logout}
        className="card-solid pressable mt-4 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-destructive shadow-sm"
      >
        <LogOut size={16} />
        {t(settings.lang, 'logout')}
      </button>

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
