import { useState } from 'react';
import { FileText, Download, Trophy, ThumbsDown, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { avgOf, votesOf } from '@/lib/mock-data';
import AdminSubPage, { AdminCard } from '@/components/AdminSubPage';

export default function ReportPage() {
  const { dishes, feedbacks } = useApp();
  const [dishId, setDishId] = useState<number | 'all'>('all');

  const scored = dishes.filter((d) => votesOf(d) >= 5).sort((a, b) => avgOf(b) - avgOf(a));
  const totalReviews = dishes.reduce((n, d) => n + d.reviews.length, 0);
  const overallAvg = scored.length ? scored.reduce((n, d) => n + avgOf(d), 0) / scored.length : 0;
  const totalVotes = dishes.reduce((n, d) => n + votesOf(d), 0);
  const pending = feedbacks.filter((f) => f.status === 'pending').length;
  const replied = feedbacks.filter((f) => f.status === 'replied').length;
  const top = scored.slice(0, 3);
  const bottom = [...scored].slice(-3).reverse();
  const most = [...dishes].sort((a, b) => b.reviews.length - a.reviews.length)[0];
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const dish = dishId !== 'all' ? dishes.find((d) => d.id === dishId) : null;

  return (
    <AdminSubPage title="总结报告" subtitle="基于全校打分数据生成的口碑简报">
      {/* 打印区域外的操作栏 */}
      <AdminCard>
        <label className="mb-2 block text-xs font-bold text-muted-foreground">报告范围</label>
        <select
          value={dishId}
          onChange={(e) => setDishId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full rounded-xl border border-border/60 bg-muted px-3.5 py-2.5 text-sm outline-none"
        >
          <option value="all">📊 全校总报告</option>
          {dishes.map((d) => (
            <option key={d.id} value={d.id}>{d.name}（{avgOf(d).toFixed(1)} 分 · {votesOf(d)} 票）</option>
          ))}
        </select>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground pressable"
          >
            <Download size={17} /> 导出 PDF / 打印
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">在弹出的打印窗口中选择「另存为 PDF」即可保存</p>
        </div>
      </AdminCard>

      {/* 报告正文（打印时保留） */}
      <div id="report-print" className="card-solid space-y-6 rounded-2xl p-7 shadow-sm">
        <div className="border-b-2 border-primary pb-4 text-center">
          <div className="mb-2 text-3xl">🍚</div>
          <h2 className="text-2xl font-black">WL Lunch 食堂口碑报告</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">上海市文来高中 · 学生食堂打分系统</p>
          <p className="mt-1 text-sm text-muted-foreground">生成日期：{today}</p>
        </div>

        {dish ? (() => {
          const avg = avgOf(dish);
          const votes = votesOf(dish);
          const good = dish.reviews.filter((r) => r.tier >= 4).length;
          const bad = dish.reviews.filter((r) => r.tier <= 2).length;
          const likes = dish.reviews.reduce((s, r) => s + r.likes, 0);
          const quotes = [...dish.reviews].sort((a, b) => b.likes - a.likes).slice(0, 5);
          return (
            <>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><FileText size={18} className="text-primary" />「{dish.name}」单品分析</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Stat label="综合均分" value={avg.toFixed(1)} sub="/ 5.0" />
                  <Stat label="打分人数" value={String(votes)} sub="人" />
                  <Stat label="累计获赞" value={String(likes)} sub="次" />
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-sm leading-relaxed">
                  共 <b>{votes}</b> 人打分，均分 <b>{avg.toFixed(1)}</b>。其中好评（4 分及以上）<b className="text-green-600">{good}</b> 条，
                  差评（2 分及以下）<b className="text-rose-500">{bad}</b> 条。
                  {good > bad ? '整体口碑不错，建议继续保持当前品质。' : bad > good ? '差评偏多，建议重点关注口味与分量。' : '评价两极分化，建议进一步收集学生意见。'}
                </p>
              </div>
              {quotes.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><MessageSquare size={18} className="text-primary" /> 精选学生评价</h3>
                  <div className="space-y-2">
                    {quotes.map((r) => (
                      <div key={r.id} className="rounded-xl bg-muted/60 px-4 py-3">
                        <p className="text-sm">“{r.text}”</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">{r.author} · {r.tier} 分 · ❤ {r.likes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })() : (
          <>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><TrendingUp size={18} className="text-primary" /> 数据概览</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="总评价数" value={String(totalReviews)} sub="条" />
                <Stat label="总投票数" value={String(totalVotes)} sub="票" />
                <Stat label="全校均分" value={overallAvg.toFixed(1)} sub="/ 5.0" />
                <Stat label="在售菜品" value={String(dishes.length)} sub="道" />
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><FileText size={18} className="text-primary" /> 一句话总结</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                全校共收到 <b className="text-foreground">{totalReviews}</b> 条评价、<b className="text-foreground">{totalVotes}</b> 次打分，整体均分 <b className="text-foreground">{overallAvg.toFixed(1)}</b>。
                最受欢迎的是「<b className="text-foreground">{top[0]?.name ?? '—'}</b>」（{top[0] ? avgOf(top[0]).toFixed(1) : '—'} 分），
                最需要改进的是「<b className="text-foreground">{bottom[0]?.name ?? '—'}</b>」（{bottom[0] ? avgOf(bottom[0]).toFixed(1) : '—'} 分）。
                同学讨论最多的是「<b className="text-foreground">{most?.name ?? '—'}</b>」。
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Trophy size={18} className="text-amber-500" /> TOP3 最爱</h3>
                <div className="space-y-2">
                  {top.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{d.name}</span>
                      <span className="text-sm font-black text-amber-600">{avgOf(d).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">{votesOf(d)} 票</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><ThumbsDown size={18} className="text-rose-500" /> TOP3 待改进</h3>
                <div className="space-y-2">
                  {bottom.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-sm font-black text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{d.name}</span>
                      <span className="text-sm font-black text-rose-600">{avgOf(d).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">{votesOf(d)} 票</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><MessageSquare size={18} className="text-primary" /> 反馈处理情况</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="待处理" value={String(pending)} sub="条" />
                <Stat label="已处理" value={String(replied)} sub="条" />
                <Stat label="处理率" value={feedbacks.length ? String(Math.round(replied / feedbacks.length * 100)) : '0'} sub="%" />
              </div>
            </div>
          </>
        )}

        <div className="border-t border-border pt-4 text-center text-[11px] text-muted-foreground/70">
          <p>本报告由 WL Lunch 自动生成 · 数据来源于全校学生真实打分</p>
        </div>
      </div>
    </AdminSubPage>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-4 text-center">
      <div className="text-xl font-black">{value}<span className="ml-0.5 text-xs font-medium text-muted-foreground">{sub}</span></div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
