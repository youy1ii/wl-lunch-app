import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Heart, ChevronDown, Send, ShieldBan } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { avgOf, tierOf, votesOf, TIERS } from '@/lib/mock-data';
import { t } from '@/lib/i18n';
import RatingSlider from '@/components/RatingSlider';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const PREVIEW_REPLIES = 2;

export default function DishDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dishes, settings, addReview, toggleLike, deleteReview, replyReview, user, isAdmin, sendAdminMessage, myRatings, followees, toggleFollow } = useApp();
  const dish = dishes.find((d) => d.id === Number(id));
  const [showDist, setShowDist] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(0);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [dmTo, setDmTo] = useState<string | null>(null);
  const [dmText, setDmText] = useState('');
  const [confirm, setConfirm] = useState<null | { kind: 'delete' | 'ban'; reviewId: number; author: string }>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [commentTab, setCommentTab] = useState<'all' | 'hot' | 'follow'>('hot');
  const [scrolled, setScrolled] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const inner = scrollRef.current;
      const outer = document.querySelector('main');
      const y = (inner && inner.scrollTop > 0) ? inner.scrollTop : (outer ? outer.scrollTop : window.scrollY);
      setShowTop(y > 300);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!dish) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {t(settings.lang, 'noResult')}
      </div>
    );
  }

  const avg = avgOf(dish);
  const tier = tierOf(avg);
  const votes = votesOf(dish);
  const p = Math.min(1, scrolled / 160);

  const submit = () => {
    if (selectedTier < 1) return;
    addReview(dish.id, selectedTier, text);
    setOpen(false);
    setSelectedTier(0);
    setText('');
    toast.success('打分成功！你的评价已上榜');
  };

  const toggleExpand = (rid: number) =>
    setExpandedIds((prev) => (prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]));

  return (
    <div className="relative h-full overflow-hidden" style={{ background: "var(--card)", marginBottom: "-8rem", paddingBottom: "8rem" }}>
      <div
        ref={scrollRef}
        onScroll={(e) => { setScrolled(e.currentTarget.scrollTop); setShowTop(e.currentTarget.scrollTop > 300); }}
        className="h-full overflow-y-auto pb-32" style={{ background: "var(--card)" }}
      >
        {/* 顶部大图区，随滚动收缩 */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            height: `${240 - p * 140}px`,
            opacity: 1 - p * 0.6,
            transform: `translateY(${-p * 60}px) scale(${1 + p * 0.15})`,
            filter: `blur(${p * 8}px) saturate(${1 - p * 0.2})`,
            background: `linear-gradient(160deg, ${tier.color}, ${tier.color}66)`,
            willChange: 'transform, filter, height',
          }}
        >
          <div className="text-4xl font-black text-white/90">{dish.name.slice(0, 1)}</div>
          <div className="mt-2 text-xl font-black text-white">{dish.name}</div>
          <div className="text-sm font-bold text-white/90">¥{dish.price}</div>
        </div>

        {/* 深色大卡片：评分 + 评论区一体，圆角从顶部开始，一直延伸到底 */}
        <div className="relative -mt-6 flex min-h-full flex-col rounded-t-3xl px-4 pb-40 pt-8">
          {/* 巨大档位字 + 均分 */}
          <div className="relative flex flex-col items-center">
            <div
              className="tier-giant transition-all duration-300"
              style={{ color: tier.color, fontSize: `${64 - p * 28}px` }}
            >
              {tier.label}
            </div>
            <div className="mt-2 text-2xl font-black">
              {avg.toFixed(1)}
              <span className="text-sm font-medium text-muted-foreground"> / 5.0</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {votes} {t(settings.lang, 'votes')}
              </span>
            </div>
            {myRatings[dish.id] && (
              <div
                className="mt-2 rounded-full px-3 py-1 text-xs font-black text-white"
                style={{ background: TIERS[5 - myRatings[dish.id]].color }}
              >
                我评了 {myRatings[dish.id]} 分 · {TIERS[5 - myRatings[dish.id]].label}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDist((v) => !v)}
              className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"
            >
              {t(settings.lang, 'distribution')}
              <ChevronDown size={14} className={cn('transition-transform', showDist && 'rotate-180')} />
            </button>

            {showDist && (
              <div className="mt-3 w-full space-y-1.5">
                {TIERS.map((tt, i) => (
                  <div key={tt.score} className="flex items-center gap-2 text-xs">
                    <span className="w-12 shrink-0 font-bold" style={{ color: tt.color }}>
                      {tt.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${votes ? (dish.counts[i] / votes) * 100 : 0}%`, background: tt.color }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{dish.counts[i]}人</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 评论区 */}
          <div className="mt-6 border-t border-border/60 pt-3">
          <h3 className="mb-2 text-sm font-black">大家怎么说 · {dish.reviews.length}</h3>
          <div className="mb-3 flex gap-1.5">
            {(['hot', 'follow', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCommentTab(tab)}
                className={
                  commentTab === tab
                    ? 'rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground pressable'
                    : 'rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground pressable'
                }
              >
                {tab === 'hot' ? '🔥 热门' : tab === 'follow' ? '👥 关注' : '全部'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {dish.reviews.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">暂无评论唷！</p>
            )}
            {[...dish.reviews]
              .filter((r) => (commentTab === 'follow' ? followees.includes(r.author) : true))
              .sort((a, b) => Number(!!b.mine) - Number(!!a.mine))
              .sort((a, b) => (commentTab === 'hot' ? b.likes - a.likes : 0))
              .map((r, i) => {
              const expanded = expandedIds.includes(r.id);
              const preview = r.replies.slice(0, PREVIEW_REPLIES);
              const rest = r.replies.slice(PREVIEW_REPLIES);
              return (
                <div
                  key={r.id}
                  className={
                    r.mine
                      ? 'anim-rise rounded-xl p-3 shadow-md ring-2 ring-primary/60 bg-card'
                      : 'card-solid anim-rise rounded-xl p-3 shadow-sm ring-1 ring-black/5'
                  }
                  style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {followees.includes(r.author) ? (
                        <button
                          type="button"
                          onClick={() => toggleFollow(r.author)}
                          className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground pressable"
                        >
                          已关注
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleFollow(r.author)}
                          className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground pressable"
                        >
                          + 关注
                        </button>
                      )}
                      {isAdmin ? (
                        <button
                          type="button"
                          className="pressable text-xs font-bold text-primary underline decoration-dotted underline-offset-2"
                          onClick={() => { setDmTo(r.author); setDmText(''); }}
                        >
                          {r.author}
                        </button>
                      ) : (
                        <span className="text-xs font-bold">{r.author}</span>
                      )}
                    </div>
                    <span
                      className="anim-pop rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: TIERS[5 - r.tier].color }}
                    >
                      {TIERS[5 - r.tier].label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">{r.text}</p>

                  {/* 操作行 */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => toggleLike(dish.id, r.id)}
                      className={cn('flex items-center gap-1 pressable', r.liked && 'text-primary')}
                    >
                      <Heart size={14} fill={r.liked ? 'currentColor' : 'none'} />
                      {r.likes}
                    </button>
                    <button
                      type="button"
                      className="pressable"
                      onClick={() => setReplyTo(replyTo === r.id ? null : r.id)}
                    >
                      {t(settings.lang, 'reply')}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="pressable text-primary"
                        onClick={() => { setDmTo(r.author); setDmText(''); }}
                      >
                        私信
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="pressable text-destructive"
                        onClick={() => setConfirm({ kind: 'ban', reviewId: r.id, author: r.author })}
                      >
                        <span className="flex items-center gap-0.5">
                          <ShieldBan size={12} />
                          封禁
                        </span>
                      </button>
                    )}
                    {(r.mine || user) && (
                      <button
                        type="button"
                        className="text-destructive pressable"
                        onClick={() => setConfirm({ kind: 'delete', reviewId: r.id, author: r.author })}
                      >
                        {t(settings.lang, 'deleteMine')}
                      </button>
                    )}
                  </div>

                  {/* 衍生评论预览 */}
                  {r.replies.length > 0 && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-muted/40 p-2">
                      {preview.map((rep) => (
                        <p key={rep.id} className="text-xs leading-relaxed text-muted-foreground">
                          <b className="text-foreground">{rep.author}</b>：{rep.text}
                        </p>
                      ))}
                      {!expanded && rest.length > 0 && (
                        <button
                          type="button"
                          className="text-xs text-primary pressable"
                          onClick={() => toggleExpand(r.id)}
                        >
                          展开全部 {r.replies.length} 条回复 ▾
                        </button>
                      )}
                      {expanded && rest.length > 0 && (
                        <>
                          {rest.map((rep) => (
                            <p key={rep.id} className="text-xs leading-relaxed text-muted-foreground">
                              <b className="text-foreground">{rep.author}</b>：{rep.text}
                            </p>
                          ))}
                          <button
                            type="button"
                            className="text-xs text-muted-foreground pressable"
                            onClick={() => toggleExpand(r.id)}
                          >
                            收起 ▴
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* 回复输入框 */}
                  {replyTo === r.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t(settings.lang, 'replyPlaceholder')}
                        className="flex-1 rounded-lg bg-muted px-2 py-1.5 text-xs outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground pressable"
                        onClick={() => {
                          replyReview(dish.id, r.id, replyText);
                          setReplyText('');
                          setReplyTo(null);
                        }}
                      >
                        {t(settings.lang, 'replyFeedback')}
                      </button>
                    </div>
                  )}

                  {/* 管理员私信内联输入 */}
                  {dmTo === r.author && (
                    <div className="anim-rise mt-2 rounded-lg bg-primary/5 p-2 ring-1 ring-primary/30">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-black text-primary">
                        <Send size={10} /> 私信 {dmTo}
                      </div>
                      <input
                        value={dmText}
                        onChange={(e) => setDmText(e.target.value)}
                        placeholder="写点什么..."
                        className="mb-2 w-full rounded-lg bg-card px-2 py-1.5 text-xs outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground pressable"
                          onClick={() => {
                            if (!dmText.trim()) return;
                            sendAdminMessage(r.author, dmText.trim());
                            toast.success(`已私信 ${r.author}`);
                            setDmTo(null); setDmText('');
                          }}
                        >
                          发送
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-muted px-3 text-xs pressable"
                          onClick={() => { setDmTo(null); setDmText(''); }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* 返回按钮固定 */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white pressable"
      >
        <ChevronLeft size={20} />
      </button>

      {/* 打分按钮：portal 到 body */}
      {createPortal(
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="anim-float pressable fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground shadow-md"
        >
          {t(settings.lang, 'myRating')}
        </button>,
        document.body,
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-md rounded-t-2xl">
          <div className="p-4">
            <div className="mb-3 text-center text-sm font-black">{t(settings.lang, 'ratingTitle')} · {dish.name}</div>
            <RatingSlider value={selectedTier} onChange={setSelectedTier} haptics={settings.haptics} dishName={dish.name} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="真的不说两句吗？？？"
              className="mt-4 h-20 w-full rounded-xl bg-muted p-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={selectedTier < 1}
              className={cn(
                'mt-3 w-full rounded-xl py-3 text-sm font-bold pressable',
                selectedTier < 1 ? 'bg-muted-foreground opacity-40' : 'bg-primary text-primary-foreground',
              )}
            >
              {t(settings.lang, 'submitRating')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
      {/* 回到顶部：portal 到 body，下滑 300px 后出现 */}
      {createPortal(
        <button
          type="button"
          onClick={() => {
            const sc = document.querySelector('main .overflow-y-auto, [class*="overflow-y-auto"]');
            if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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

      {/* 确认弹窗 */}
      {confirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setConfirm(null)}>
          <div className="anim-rise w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldBan size={22} />
            </div>
            <h3 className="text-center text-base font-black">
              {confirm.kind === 'delete' ? '删除这条评价？' : `封禁 ${confirm.author}？`}
            </h3>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {confirm.kind === 'delete'
                ? '删除后不可恢复，对方会收到删除通知。'
                : '封禁后该账号将无法登录、无法打分和评论。此操作仅演示。'}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold text-muted-foreground pressable"
                onClick={() => setConfirm(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-white pressable"
                onClick={() => {
                  if (confirm.kind === 'delete') {
                    deleteReview(dish.id, confirm.reviewId);
                    toast.success('评价已删除');
                  } else {
                    toast.success(`已封禁 ${confirm.author}（演示）`);
                  }
                  setConfirm(null);
                }}
              >
                确认{confirm.kind === 'delete' ? '删除' : '封禁'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
