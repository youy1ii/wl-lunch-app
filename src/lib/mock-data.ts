// EXPORTS: TIERS, WINDOWS, avgOf, tierIndexOf, tierOf, MOCK_DISHES, MOCK_ANNOUNCEMENTS, MOCK_BANNERS

import type { IDish, IReview, IAnnouncement, IBanner, WindowId } from './types';

// EXPORTS: ITier{score,label,color,bg}
export interface ITier {
  score: number;
  label: string;
  color: string;
  bg: string;
}

// 五档：夯=5 → 拉完了=1
export const TIERS: ITier[] = [
  { score: 5, label: '夯', color: '#E8B923', bg: '#FBF0CF' },
  { score: 4, label: '顶级', color: '#5B8C5A', bg: '#E4EFE3' },
  { score: 3, label: '人上人', color: '#38B6FF', bg: '#DFF2FF' },
  { score: 2, label: 'NPC', color: '#8A94A6', bg: '#E9ECF1' },
  { score: 1, label: '拉完了', color: '#C13584', bg: '#FBE0F1' },
];

export interface IWindowMeta {
  id: WindowId;
  name: string;
  emoji: string;
}

export const WINDOWS: IWindowMeta[] = [
  { id: 'doumian', name: '抖面', emoji: '面' },
  { id: 'zixuan', name: '自选', emoji: '选' },
  { id: 'chashao', name: '港式叉烧', emoji: '烧' },
  { id: 'global', name: '环球美食', emoji: '环' },
];

export function votesOf(dish: IDish): number {
  return dish.counts.reduce((a, b) => a + b, 0);
}

export function avgOf(dish: IDish): number {
  const v = votesOf(dish);
  if (v === 0) return 0;
  const sum = dish.counts.reduce((acc, c, i) => acc + c * (i + 1), 0);
  return sum / v;
}

// 均分 → 档位索引（0=夯 … 4=拉完了）
export function tierIndexOf(avg: number): number {
  if (avg >= 4.5) return 0;
  if (avg >= 3.7) return 1;
  if (avg >= 2.8) return 2;
  if (avg >= 1.8) return 3;
  return 4;
}

export function tierOf(avg: number): ITier {
  return TIERS[tierIndexOf(avg)];
}

// deterministic pseudo-random
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOOD = [
  '今天这个真的夯，吃完还想再来一份',
  '面条很筋道，汤头也浓，值了',
  '排队半小时但真香',
  '阿姨手没抖，分量给得很足',
  '这个价位能吃到这样，顶级',
];
const MID = ['还行吧，中规中矩', '不难吃但也不惊艳', '今天的盐好像不要钱', '看阿姨发挥，今天发挥一般'];
const BAD = ['等了二十分钟结果就这', '吃完肚子不太舒服', '价格和分量不成正比', '冷了，像是放了很久'];
const NICK = ['干饭王', '面痴', '排队王', '三楼常客', '米饭仙人', '早八人', '食堂观察员', '加辣选手', '米饭刺客', '汤达人'];

function genReviews(q: number, seed: number): IReview[] {
  const rnd = mulberry32(seed);
  const n = 2 + Math.floor(rnd() * 3);
  const out: IReview[] = [];
  for (let i = 0; i < n; i++) {
    const good = q >= 4;
    const mid = q === 3;
    const pool = good ? GOOD : mid ? MID : BAD;
    const tier = Math.max(1, Math.min(5, q + (rnd() < 0.3 ? 1 : rnd() < 0.4 ? -1 : 0)));
    const replies: { id: number; author: string; text: string }[] = [];
    if (i % 3 === 0) {
      const nReplies = 2 + Math.floor(rnd() * 3);
      const replyTexts = ['+1 我也觉得', '哈哈哈哈真的', '今天刚吃过，确实', '同意', '握手', '下次试试加辣'];
      for (let j = 0; j < nReplies; j++) {
        replies.push({
          id: seed * 1000 + i * 10 + j,
          author: '@' + NICK[Math.floor(rnd() * NICK.length)],
          text: replyTexts[Math.floor(rnd() * replyTexts.length)],
        });
      }
    }
    out.push({
      id: seed * 100 + i,
      author: '@' + NICK[Math.floor(rnd() * NICK.length)],
      tier,
      text: pool[Math.floor(rnd() * pool.length)],
      likes: Math.floor(rnd() * 25),
      liked: false,
      replies,
    });
  }
  return out;
}

function genCounts(q: number, seed: number): number[] {
  const rnd = mulberry32(seed + 7);
  const total = 8 + Math.floor(rnd() * 22);
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < total; i++) {
    const r = rnd();
    let tier = q;
    if (r < 0.18) tier = q + 1;
    else if (r < 0.45) tier = q - 1;
    else if (r < 0.62) tier = q - 2;
    tier = Math.max(1, Math.min(5, tier));
    counts[tier - 1]++;
  }
  return counts;
}

type Seed = [string, number, number, WindowId];

const VEGGIE_NAMES = new Set(['番茄鸡蛋面', '麻酱凉面', '番茄炒蛋', '蒜蓉西兰花', '麻婆豆腐', '干煸豆角']);

const RAW: Seed[] = [
  ['老坛牛肉面', 18, 5, 'doumian'],
  ['葱油拌面', 15, 3, 'doumian'],
  ['豚骨拉面', 22, 4, 'doumian'],
  ['重庆小面', 16, 4, 'doumian'],
  ['番茄鸡蛋面', 14, 3, 'doumian'],
  ['麻酱凉面', 15, 2, 'doumian'],
  ['雪菜肉丝面', 16, 3, 'doumian'],
  ['糖醋里脊', 20, 5, 'zixuan'],
  ['番茄炒蛋', 12, 3, 'zixuan'],
  ['宫保鸡丁', 19, 4, 'zixuan'],
  ['蒜蓉西兰花', 10, 2, 'zixuan'],
  ['可乐鸡翅', 21, 4, 'zixuan'],
  ['麻婆豆腐', 14, 2, 'zixuan'],
  ['干煸豆角', 13, 1, 'zixuan'],
  ['叉烧饭', 24, 5, 'chashao'],
  ['烧鹅濑粉', 26, 4, 'chashao'],
  ['菠萝油', 8, 4, 'chashao'],
  ['云吞面', 20, 3, 'chashao'],
  ['咖喱牛腩饭', 25, 2, 'chashao'],
  ['奶油培根意面', 28, 3, 'global'],
  ['照烧鸡腿饭', 23, 4, 'global'],
  ['韩式拌饭', 22, 4, 'global'],
  ['天妇罗乌冬', 27, 2, 'global'],
  ['墨西哥鸡肉卷', 21, 3, 'global'],
  ['咖喱猪排饭', 26, 1, 'global'],
];

export const MOCK_DISHES: IDish[] = RAW.map(([name, price, q, windowId], i) => ({
  id: i + 1,
  name,
  price,
  veggie: VEGGIE_NAMES.has(name),
  windowId,
  counts: genCounts(q, i + 1),
  reviews: genReviews(q, i + 1),
}));

export const MOCK_ANNOUNCEMENTS: IAnnouncement[] = [
  {
    id: 1,
    title: '欢迎来到 WL Lunch 测试版',
    body: '这是我们社团做的食堂打分小程序测试版。\n\n你可以给每道菜打分（夯→拉完了五档），看看全校最爱的菜和最拉的菜。\n\n有任何问题或建议，去「我的 → 反馈」告诉我们。',
    date: '2026-10-23',
  },
];

export const MOCK_BANNERS: IBanner[] = [
  { id: 1, title: '社团招新进行中', target: '/announcements' },
  { id: 2, title: '本周新品：港式叉烧', target: '/dishes' },
  { id: 3, title: '给我们加个鸡腿', target: 'https://example.com/tip' },
];
