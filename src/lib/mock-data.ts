// EXPORTS: TIERS, WINDOWS, avgOf, tierIndexOf, tierOf, tierLabel, MOCK_DISHES, MOCK_ANNOUNCEMENTS, MOCK_BANNERS

import type { IDish, IReview, IAnnouncement, IBanner, WindowId, Lang } from './types';
import { t } from './i18n';

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

// 按界面语言取段位标签（score 5→1 对应 tier5→tier1）
export function tierLabel(score: number, lang: Lang): string {
  return t(lang, `tier${score}`);
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
  '夯',
  '好吃',
  '今天这个真的夯，吃完还想再来一份',
  '面条很筋道，汤头也浓，值了',
  '排队半小时但真香',
  '阿姨手没抖，分量给得很足',
  '这个价位能吃到这样，顶级',
  '强烈推荐！我连汤都喝光了，面条非常有嚼劲，汤底熬得很浓，咸淡刚好，里面的肉也给得很实在，大片大片的。这个价格在食堂能吃到这种水准真的很意外，我已经连续三天来吃了，同学都被我安利了一圈，明天还要来。',
  'yyds',
  '绝绝子',
  '好吃到流泪',
  '这个叉烧真的绝，肥瘦相间，蜜汁烤得刚刚好，配米饭一绝。菠萝油也很酥，冰火两重天的感觉，推荐大家试试',
  '第一口就震惊了，这个价位能做成这样真的没想到，已经加入我的每周固定菜单',
  '好评',
  '这个菜我真的要好好说道说道。首先它的卖相就很诱人，色泽金黄，闻起来有一股很香的味道。端上来的时候还冒着热气，一看就是刚出锅的。我第一口下去就被惊艳到了，口感外酥里嫩，调味也刚刚好，不会太咸也不会太淡。里面的料给得很足，能吃得出是用心做的，不是那种敷衍的预制菜。价格也很良心，在食堂里这个价位真的很能打。我已经连续一周来吃了，每次都不失望。唯一的小缺点就是高峰期要排队，不过为了这口好吃的，排队也是值得的。强烈推荐给还没试过的同学，相信我，吃一次你就会爱上的。',
];
const MID = ['还行吧，中规中矩', '不难吃但也不惊艳', '今天的盐好像不要钱', '看阿姨发挥，今天发挥一般', '一般般吧', '凑合', '吃个饱而已', '今天的米饭有点硬', '肉给得比昨天少', '味道就是食堂平均水平，没什么记忆点，饿了可以吃，专门来排队没必要'];
const BAD = ['等了二十分钟结果就这', '吃完肚子不太舒服', '价格和分量不成正比', '冷了，像是放了很久', '难吃', '拉', '这个真的不行，等了半天端上来是凉的，面条已经坨成一团了，味道也很奇怪，醋放多了酸得倒牙，我吃了一口就放下了，剩下的全倒了，这个价位真的不值', '踩雷了家人们', '别来', '今天厨师手抖了吧，咸得我喝了三杯水', '感觉是预制菜加热的，没锅气'];
const NICK = ['糖醋里脊永远的神', '二楼麻辣烫yyds', '今天也饿了', '不吃香菜星人', '下课冲食堂第一人', '汤泡饭爱好者', '阿姨手别抖', '第三窗口常驻', '早八干饭人', '食堂试毒员', '米饭添一碗', '加辣不要钱', '叉烧饭代言人', '菠萝油爱好者', '环球美食探险家', '自选菜困难户', '今天吃什么呢', '面要硬一点', '少盐少油不行', '糖醋党'];

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
    title: '欢迎参与WL Lunch的内测！',
    body: '本软件由上海市文来高中2026级学生同人社团LC与AI辅助开发，由衷感谢各位参与内测。有问题请及时通过社交平台反馈至我的账号\n\n本次测试为不留档测试，仅做功能试用。系统不会索取和保留任何人的任何信息，随便填写即可\n\n最后再感谢一次！喜欢我们可以请我们喝口水！',
    date: '2026-10-23',
  },
];

export const MOCK_BANNERS: IBanner[] = [
  { id: 0, title: '管理员招募中', target: 'https://qun.qq.com/universal-share/share?ac=1&authKey=cJaSzG0JTrkhVCSgj%2Fuc7dgpfnrlvp8rf6861B69aZ3zh4EzuscsC3y7rD5txNz3&busi_data=eyJncm91cENvZGUiOiIxMTI2ODM0NjU4IiwidG9rZW4iOiI5Z1hXSWJGT3JyY01VcmR2QVVhNmJIOWZrbHo4d3YrUjF3b1JKUkVJQTBVaTJwejZXZk9SL2xVaXRxeVVQQmVRIiwidWluIjoiMzM1MjM2MDE4OSJ9&data=ENsL2tVCVdVMsl23ITTHVSRSmdubuHHK5_uTZ-0Ny7A_-AYvYnAFHHseGUTz31SBKqP2z9fi18lqOXRadGOikA&svctype=4&tempid=h5_group_info', image: import.meta.env.BASE_URL + 'recruit-banner.jpg' },
  { id: 1, title: '社团招新进行中', target: '/announcements' },
  { id: 2, title: '本周新品：港式叉烧', target: '/dishes' },
  { id: 3, title: '给我们加个鸡腿', target: 'https://example.com/tip' },
];
