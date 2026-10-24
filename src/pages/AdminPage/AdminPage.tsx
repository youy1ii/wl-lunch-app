import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Trash2, Plus, FileText, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { WINDOWS, avgOf, votesOf } from '@/lib/mock-data';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import type { WindowId } from '@/lib/types';

export default function AdminPage() {
  const {
    dishes,
    feedbacks,
    banners,
    settings,
    announcements,
    ticker,
    setTicker,
    togglePin,
    addDish,
    deleteDish,
    toggleDishNew,
    replyFeedback,
    postAnnouncement,
    setBanners,
    tipsQr,
    setTipsQr,
    sendAdminMessage,
    frames: avatarFrames,
    issueFrame,
    uploadFrame,
  } = useApp();
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [win, setWin] = useState<WindowId>('doumian');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annImage, setAnnImage] = useState('');
  const [annLink, setAnnLink] = useState('');
  const annImgRef = useRef<HTMLInputElement>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerTarget, setBannerTarget] = useState('');
  const [bannerImage, setBannerImage] = useState<string>('');
  const [bannerExternalUrl, setBannerExternalUrl] = useState('');
  const bannerImgRef = useRef<HTMLInputElement>(null);
  const [tickerDraft, setTickerDraft] = useState('');
  const [dmTarget, setDmTarget] = useState('');

  useEffect(() => {
    const onScroll = () => {
      const outer = document.querySelector('main');
      setShowTop(outer ? outer.scrollTop > 300 : false);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);
  const [dmText, setDmText] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportDishId, setReportDishId] = useState<number | 'all'>('all');
  const [selectedForReport, setSelectedForReport] = useState<number[]>([]);
  const [frameName, setFrameName] = useState('');
  const [frameUnlock, setFrameUnlock] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [frameImg, setFrameImg] = useState('');
  const [issueTarget, setIssueTarget] = useState('');
  const qrRef = useRef<HTMLInputElement>(null);

  const report = (() => {
    const scored = dishes.filter((d) => votesOf(d) >= 5).sort((a, b) => avgOf(b) - avgOf(a));
    const totalReviews = dishes.reduce((n, d) => n + d.reviews.length, 0);
    const avg = scored.length ? scored.reduce((n, d) => n + avgOf(d), 0) / scored.length : 0;
    return {
      totalReviews,
      avg,
      top: scored.slice(0, 3),
      bottom: [...scored].slice(-3).reverse(),
      most: [...dishes].sort((a, b) => b.reviews.length - a.reviews.length)[0],
      pending: feedbacks.filter((f) => f.status === 'pending').length,
    };
  })();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">{t(settings.lang, 'admin')}</h1>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* 使用导览 */}
        <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <h3 className="mb-2 text-sm font-black text-primary">👋 管理后台导览</h3>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li>① <b className="text-foreground">总结报告</b> — 一键生成食堂口碑简报</li>
            <li>② <b className="text-foreground">菜品管理</b> — 加新菜 / 删菜（删菜会连带删评价）</li>
            <li>③ <b className="text-foreground">公告</b> — 学生进 App 会强制弹窗看</li>
            <li>④ <b className="text-foreground">滚动通知</b> — 首页常驻小喇叭，关不掉</li>
            <li>⑤ <b className="text-foreground">Banner 轮播</b> — 传海报图，可跳链接</li>
            <li>⑥ <b className="text-foreground">置顶公告</b> — 评论区顶部固定显示</li>
            <li>⑦ <b className="text-foreground">赞赏码</b> — 学生打赏的收款码</li>
            <li>⑧ <b className="text-foreground">反馈箱</b> — 处理学生提交的反馈</li>
            <li>⑨ <b className="text-foreground">私信广播</b> — 给所有学生发系统消息</li>
          </ol>
        </section>

        {/* 功能导航卡片墙 */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { id: 'sec-report', icon: '📊', label: '总结报告', color: '#E8B923' },
            { id: 'sec-dishes', icon: '🍜', label: '菜品管理', color: '#5B8C5A' },
            { id: 'sec-announce', icon: '📢', label: '公告', color: '#38B6FF' },
            { id: 'sec-ticker', icon: '📣', label: '滚动通知', color: '#C13584' },
            { id: 'sec-banner', icon: '🖼️', label: 'Banner', color: '#8B5CF6' },
            { id: 'sec-pinned', icon: '📌', label: '置顶公告', color: '#F97316' },
            { id: 'sec-tips', icon: '💰', label: '赞赏码', color: '#10B981' },
            { id: 'sec-feedback', icon: '📬', label: '反馈箱', color: '#EF4444' },
            { id: 'sec-dm', icon: '✉️', label: '私信广播', color: '#6366F1' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="card-solid flex flex-col items-center gap-1 rounded-2xl p-3 pressable transition-transform hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${item.color}22, transparent 60%)` }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl shadow-sm"
                style={{ background: `${item.color}33` }}
              >
                {item.icon}
              </span>
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </section>

        {/* 头像框管理 */}
        <div className="card-solid rounded-2xl p-4 shadow-sm">
          <h2 className="mb-3 text-base font-black">✨ 头像框管理</h2>
          <div className="mb-2 flex gap-2">
            <input value={frameName} onChange={(e) => setFrameName(e.target.value)} placeholder="框名字" className="w-24 rounded-lg bg-muted px-2 py-1 text-xs" />
            <input value={frameUnlock} onChange={(e) => setFrameUnlock(e.target.value)} placeholder="获取说明" className="flex-1 rounded-lg bg-muted px-2 py-1 text-xs" />
          </div>
          <div className="mb-2 flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onload = () => setFrameImg(r.result as string); r.readAsDataURL(f);
            }} className="text-xs" />
            {frameImg && <img src={frameImg} className="h-10 w-10 rounded-full" />}
          </div>
          <button
            type="button"
            onClick={() => { if (frameName) { uploadFrame({ name: frameName, unlockText: frameUnlock || '待解锁', imageUrl: frameImg, special: true }); setFrameName(''); setFrameUnlock(''); setFrameImg(''); setUploaded(true); setTimeout(() => setUploaded(false), 2000); } }}
            className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground pressable"
          >
            {uploaded ? '✅ 上传成功！' : '上传新头像框'}
          </button>
          <div className="mt-3 border-t border-border pt-2">
            <div className="mb-1 text-xs font-bold">现有头像框：</div>
            {avatarFrames.map((fr) => (
              <div key={fr.id} className="mb-1 flex items-center gap-2 text-xs">
                <span className="flex-1">{fr.name}（{fr.issuedTo.length}人拥有）</span>
                <input value={issueTarget} onChange={(e) => setIssueTarget(e.target.value)} placeholder="发给谁" className="w-20 rounded bg-muted px-1 py-0.5" />
                <button type="button" onClick={() => { if (issueTarget) { issueFrame(fr.id, issueTarget); setIssueTarget(''); } }} className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground pressable">颁发</button>
              </div>
            ))}
          </div>
        </div>

        {/* 一键报告 */}
        <section id="sec-report" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black">
            <FileText size={16} className="text-primary" />
            总结报告
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">基于当前所有打分数据，生成一份食堂口碑简报。</p>
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="w-full rounded-2xl bg-primary py-2.5 text-sm font-black text-primary-foreground pressable"
          >
            一键生成报告
          </button>
        </section>

        {/* 菜品管理 */}
        <section id="sec-dishes" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">{t(settings.lang, 'adminDishes')}</h3>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(settings.lang, 'dishName')} className="flex-1 rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="¥" className="w-14 rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
            <select value={win} onChange={(e) => setWin(e.target.value as WindowId)} className="rounded-lg bg-muted px-2 text-sm">
              {WINDOWS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!name.trim() || !price) return;
                addDish(name.trim(), Number(price), win);
                setName(''); setPrice('');
                toast.success(t(settings.lang, 'saved'));
              }}
              className="rounded-lg bg-primary p-2 text-white"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {dishes.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {d.name} <span className="text-xs text-muted-foreground">¥{d.price}</span>
                  {d.isNew && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">新品</span>}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDishNew(d.id)}
                    className={d.isNew ? 'rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white' : 'rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'}
                  >
                    {d.isNew ? '取消新品' : '标新品'}
                  </button>
                  <button type="button" onClick={() => deleteDish(d.id)} className="text-destructive">
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 发公告 */}
        <section id="sec-announce" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">{t(settings.lang, 'adminAnnounce')}</h3>
          <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="公告标题" className="mb-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
          <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="公告内容（可以写活动通知、菜单调整、节日祝福...）" className="h-24 w-full rounded-lg bg-muted p-2 text-sm outline-none" />
          {/* 图片上传 */}
          <input
            ref={annImgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => setAnnImage(reader.result as string);
              reader.readAsDataURL(f);
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => annImgRef.current?.click()}
              className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold pressable"
            >
              🖼️ 上传配图（可选）
            </button>
            {annImage && (
              <button
                type="button"
                onClick={() => setAnnImage('')}
                className="text-xs text-muted-foreground"
              >
                移除
              </button>
            )}
          </div>
          {annImage && (
            <img src={annImage} alt="预览" className="mt-2 max-h-32 rounded-lg object-cover" />
          )}
          {/* 链接 */}
          <input
            value={annLink}
            onChange={(e) => setAnnLink(e.target.value)}
            placeholder="链接地址（可选，比如 https://...）"
            className="mt-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!annTitle.trim()) return;
              postAnnouncement(annTitle.trim(), annBody.trim(), annImage || undefined, annLink || undefined);
              setAnnTitle(''); setAnnBody(''); setAnnImage(''); setAnnLink('');
              toast.success(t(settings.lang, 'saved'));
            }}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
          >
            {t(settings.lang, 'postAnnounce')}
          </button>
        </section>

        {/* 滚动通知 */}
        <section id="sec-ticker" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">主页滚动通知（常驻显示）</h3>
          <p className="mb-2 text-xs text-muted-foreground">当前：{ticker}</p>
          <div className="flex gap-2">
            <input
              value={tickerDraft}
              onChange={(e) => setTickerDraft(e.target.value)}
              placeholder="输入要滚动的通知内容"
              className="flex-1 rounded-lg bg-muted px-2 py-1.5 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!tickerDraft.trim()) return;
                setTicker(tickerDraft.trim());
                toast.success(t(settings.lang, 'saved'));
              }}
              className="rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground"
            >
              发布
            </button>
          </div>
        </section>

        {/* 管理员私信 */}
        <section className="card-solid rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black">
            <Send size={16} className="text-primary" />
            发送私信
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">向指定同学发管理员私信（留空=全员广播）。</p>
          <input
            value={dmTarget}
            onChange={(e) => setDmTarget(e.target.value)}
            placeholder="对方昵称（@xxx），留空则广播"
            className="mb-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none"
          />
          <textarea
            value={dmText}
            onChange={(e) => setDmText(e.target.value)}
            placeholder="写点什么..."
            className="h-20 w-full rounded-lg bg-muted p-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!dmText.trim()) return;
              sendAdminMessage(dmTarget.trim(), dmText.trim());
              setDmTarget(''); setDmText('');
              toast.success('已发送');
            }}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
          >
            发送
          </button>
        </section>

        {/* 置顶公告 */}
        <section id="sec-pinned" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">置顶公告</h3>
          {announcements.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
              <span className="truncate">{a.title}</span>
              <button
                type="button"
                onClick={() => togglePin(a.id)}
                className={a.pinned ? 'rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground' : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'}
              >
                {a.pinned ? '已置顶' : '置顶'}
              </button>
            </div>
          ))}
        </section>

        {/* Banner */}
        <section className="card-solid rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 text-sm font-black">{t(settings.lang, 'adminBanner')}</h3>
          <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder={t(settings.lang, 'bannerTitle')} className="mb-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
          <label className="mb-1 block text-xs font-bold text-muted-foreground">点击 Banner 跳转</label>
          <select
            value={bannerTarget}
            onChange={(e) => setBannerTarget(e.target.value)}
            className="mb-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none"
          >
            <option value="">不跳转（纯展示）</option>
            <option value="/">跳转到首页</option>
            <option value="/leaderboard">跳转到排行榜</option>
            <option value="/dishes">跳转到打分页</option>
            <option value="/me">跳转到我的</option>
            <option value="/feedback">跳转到反馈页</option>
            <option value="__external__">打开外部链接（网址填下面）</option>
          </select>
          {bannerTarget === '__external__' && (
            <input
              value={bannerExternalUrl || ''}
              onChange={(e) => setBannerExternalUrl(e.target.value)}
              placeholder="粘贴网址，比如 https://example.com"
              className="mb-2 w-full rounded-lg bg-muted px-2 py-1.5 text-sm outline-none"
            />
          )}
          {/* 海报图上传 + 自动 16:9 居中裁剪 */}
          <input
            ref={bannerImgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                const img = new Image();
                img.onload = () => {
                  const targetW = 960;
                  const targetH = 540; // 16:9
                  const scale = Math.max(targetW / img.width, targetH / img.height);
                  const w = img.width * scale;
                  const h = img.height * scale;
                  const sx = (img.width - targetW / scale) / 2;
                  const sy = (img.height - targetH / scale) / 2;
                  const canvas = document.createElement('canvas');
                  canvas.width = targetW;
                  canvas.height = targetH;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  ctx.drawImage(img, sx, sy, targetW / scale, targetH / scale, 0, 0, targetW, targetH);
                  setBannerImage(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.src = String(r.result);
              };
              r.readAsDataURL(f);
            }}
          />
          {bannerImage ? (
            <div className="mb-2 overflow-hidden rounded-xl ring-1 ring-black/10">
              <img src={bannerImage} alt="banner" className="h-24 w-full object-cover" />
            </div>
          ) : null}
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => bannerImgRef.current?.click()}
              className="flex-1 rounded-lg bg-muted py-2 text-sm font-bold"
            >
              {bannerImage ? '重新上传海报' : '上传海报图（自动裁剪 16:9）'}
            </button>
            {bannerImage && (
              <button type="button" onClick={() => setBannerImage('')} className="rounded-lg bg-muted px-3 text-sm text-destructive">
                移除
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!bannerTitle.trim()) return;
              setBanners([...banners, { id: Date.now(), title: bannerTitle.trim(), target: bannerTarget.trim() || '/', image: bannerImage || undefined }]);
              setBannerTitle(''); setBannerTarget(''); setBannerImage('');
              toast.success(t(settings.lang, 'saved'));
            }}
            className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-white"
          >
            {t(settings.lang, 'addDish')}
          </button>
          {/* 已有 Banner 列表 */}
          <div className="mt-3 space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded-lg bg-muted p-2 text-xs">
                {b.image ? (
                  <img src={b.image} alt="" className="h-8 w-14 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-8 w-14 shrink-0 rounded bg-primary/30" />
                )}
                <div className="flex-1 truncate">{b.title}</div>
                <span className="text-muted-foreground">{b.target}</span>
                <button type="button" onClick={() => setBanners(banners.filter((x) => x.id !== b.id))} className="text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 赞赏码 */}
        <section id="sec-tips" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">{t(settings.lang, 'adminTips')}</h3>
          <input ref={qrRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => setTipsQr(String(r.result));
            r.readAsDataURL(f);
          }} />
          {tipsQr && (
            <div className="mb-2 flex items-center gap-2">
              <img src={tipsQr} className="h-20 w-20 rounded-lg object-cover" alt="preview" />
              <span className="text-xs font-bold text-green-600">✅ 已上传</span>
            </div>
          )}
          <button type="button" onClick={() => qrRef.current?.click()} className="w-full rounded-lg bg-muted py-2 text-sm font-bold">
            {tipsQr ? '更换图片' : t(settings.lang, 'uploadImage')}
          </button>
        </section>

        {/* 反馈处理 */}
        <section id="sec-feedback" className="card-solid rounded-2xl p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-black">{t(settings.lang, 'adminFeedback')} ({feedbacks.filter((f) => f.status === 'pending').length})</h3>
          {feedbacks.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          {feedbacks.map((f) => (
            <div key={f.id} className="mb-2 border-b border-border pb-2 text-sm">
              <p>{f.text}</p>
              {f.status === 'pending' ? (
                <input
                  placeholder={t(settings.lang, 'replyPlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      replyFeedback(f.id, (e.target as HTMLInputElement).value.trim());
                      toast.success(t(settings.lang, 'saved'));
                    }
                  }}
                  className="mt-1 w-full rounded-lg bg-muted px-2 py-1 text-xs outline-none"
                />
              ) : (
                <p className="mt-1 text-xs text-success">↳ {f.reply}</p>
              )}
            </div>
          ))}
        </section>
      </div>

      {/* 报告弹层（portal 到 body，避免被 transform 困住） */}
      {showReport && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowReport(false)}>
          <div
            className="anim-rise card-solid max-h-[80%] w-full max-w-md overflow-y-auto rounded-t-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black">食堂口碑简报</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground pressable"
                >
                  📄 下载 PDF
                </button>
                <button type="button" onClick={() => setShowReport(false)} className="pressable rounded-full bg-muted p-1">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-bold text-muted-foreground">选择菜品生成单菜报告</label>
              <select
                value={reportDishId}
                onChange={(e) => setReportDishId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none"
              >
                <option value="all">📊 全校总报告</option>
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}（{avgOf(d).toFixed(1)} 分 · {votesOf(d)} 票）
                  </option>
                ))}
              </select>
            </div>
            {reportDishId === 'all' && selectedForReport.length > 0 && (
              <p className="mb-2 text-xs text-primary">已选 {selectedForReport.length} 道菜做对比分析</p>
            )}
            {reportDishId === 'all' ? (
              <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted p-2">
                <div className="text-lg font-black">{report.totalReviews}</div>
                <div className="text-[10px] text-muted-foreground">总评价数</div>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <div className="text-lg font-black">{report.avg.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">全校均分</div>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <div className="text-lg font-black">{report.pending}</div>
                <div className="text-[10px] text-muted-foreground">待处理反馈</div>
              </div>
            </div>
            <div className="mt-4 text-sm leading-relaxed">
              <p className="mb-2 font-bold">📊 一句话总结</p>
              <p className="mb-3 text-muted-foreground">
                全校共收到 {report.totalReviews} 条评价，整体均分 {report.avg.toFixed(1)}。
                最受欢迎的是「{report.top[0]?.name ?? '—'}」（{report.top[0] ? avgOf(report.top[0]).toFixed(1) : '—'} 分），
                最需要改进的是「{report.bottom[0]?.name ?? '—'}」（{report.bottom[0] ? avgOf(report.bottom[0]).toFixed(1) : '—'} 分）。
                同学讨论最多的菜是「{report.most?.name ?? '—'}」。
              </p>
              <p className="mb-2 font-bold">🏆 TOP3 最爱</p>
              {report.top.map((d, i) => (
                <p key={d.id} className="text-muted-foreground">
                  {i + 1}. {d.name} — {avgOf(d).toFixed(1)} 分（{votesOf(d)} 票）
                </p>
              ))}
              <p className="mb-2 mt-3 font-bold">👎 TOP3 最拉</p>
              {report.bottom.map((d, i) => (
                <p key={d.id} className="text-muted-foreground">
                  {i + 1}. {d.name} — {avgOf(d).toFixed(1)} 分（{votesOf(d)} 票）
                </p>
              ))}
            </div>
              </>
            ) : (() => {
              const d = dishes.find((x) => x.id === reportDishId);
              if (!d) return null;
              const avg = avgOf(d);
              const votes = votesOf(d);
              const good = d.reviews.filter((r) => r.tier >= 4).length;
              const bad = d.reviews.filter((r) => r.tier <= 2).length;
              const likes = d.reviews.reduce((s, r) => s + r.likes, 0);
              return (
                <div className="mt-2 text-sm leading-relaxed">
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted p-2">
                      <div className="text-lg font-black">{avg.toFixed(1)}</div>
                      <div className="text-[10px] text-muted-foreground">均分</div>
                    </div>
                    <div className="rounded-xl bg-muted p-2">
                      <div className="text-lg font-black">{votes}</div>
                      <div className="text-[10px] text-muted-foreground">票数</div>
                    </div>
                    <div className="rounded-xl bg-muted p-2">
                      <div className="text-lg font-black">{likes}</div>
                      <div className="text-[10px] text-muted-foreground">获赞</div>
                    </div>
                  </div>
                  <p className="mb-2 font-bold">🍜 「{d.name}」单菜报告</p>
                  <p className="mb-2 text-muted-foreground">
                    共 {votes} 人打分，均分 {avg.toFixed(1)}。好评（≥4分）{good} 条，差评（≤2分）{bad} 条。
                    {good > bad ? '整体口碑不错，可以继续保持。' : bad > good ? '差评偏多，建议关注改进。' : '评价两极分化，可观察。'}
                  </p>
                  <p className="mb-1 font-bold">💬 精选评论</p>
                  {[...d.reviews].sort((a, b) => b.likes - a.likes).slice(0, 3).map((r) => (
                    <p key={r.id} className="mb-1 text-muted-foreground">
                      · {r.text} <span className="text-[10px]">（❤{r.likes}）</span>
                    </p>
                  ))}
                </div>
              );
            })()}
            <p className="mt-4 text-[10px] text-muted-foreground/70">
              * 当前为本地数据生成；接入 AI 模型后可输出更详细的文字分析和改进建议。
            </p>
          </div>
        </div>,
        document.body,
      )}

      {/* 回到顶部 */}
      {createPortal(
        <button
          type="button"
          onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
          className={
            showTop
              ? 'fixed bottom-24 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl pressable anim-pop'
              : 'pointer-events-none fixed bottom-24 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition-opacity'
          }
          aria-label="回到顶部"
        >
          ↑
        </button>,
        document.body,
      )}
    </div>
  );
}
