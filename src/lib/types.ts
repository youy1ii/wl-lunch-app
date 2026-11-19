// EXPORTS: WindowId, Lang, IReply, IReview, IDish, IAnnouncement, IBanner, IFeedback, IUser, ISettings

export type WindowId = 'doumian' | 'zixuan' | 'chashao' | 'global';
export type Lang = 'zh' | 'ja' | 'en';

export interface IReply {
  id: number;
  author: string;
  text: string;
}

export interface IReview {
  id: number;
  author: string;
  tier: number; // 1-5，5=夯
  text: string;
  likes: number;
  liked: boolean;
  replies: IReply[];
  mine?: boolean;
  authorUid?: string;
  createdAt?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'supper';

export interface IDish {
  id: number;
  name: string;
  windowId: WindowId;
  price: number;
  veggie?: boolean; // 素菜
  isNew?: boolean; // 新品标记
  mealType?: MealType; // 早饭/中饭/晚饭/夜宵
  tags?: string[]; // 辣/汤/素/甜/咸 etc
  image?: string; // 菜品预览图 dataURL
  launchDate?: string; // 菜品上线日期 YYYY-MM-DD
  counts: number[]; // 索引 0..4 对应 1..5 分的人数
  reviews: IReview[];
}

export interface IAnnouncement {
  id: number;
  title: string;
  body: string;
  date: string;
  pinned?: boolean;
  imageUrl?: string;
  linkUrl?: string;
  authorUid?: string;
}

export interface INotification {
  id: number;
  kind: 'like' | 'reply' | 'admin' | 'feedback';
  text: string;
  time: string;
  read: boolean;
  feedbackText?: string;
  replyText?: string;
  adminRep?: string;
  replyTime?: string;
}

export interface IBanner {
  id: number;
  title: string;
  target: string; // 站内路径 或 外链
  image?: string; // dataURL 裁剪后的海报图
}

export interface IFeedback {
  id: number;
  kind: 'suggest' | 'complain';
  text: string;
  anonymous: boolean;
  status: 'pending' | 'replied';
  reply?: string;
  author: string;
  authorUid?: string;
  authorRealName?: string;
  adminRep?: string;
  repliedAt?: string;
  createdAt?: string;
}

export interface IUser {
  uid?: string; // 8-digit, admin = 00000000
  username: string;
  nickname?: string;
  realName: string;
  role: 'student' | 'teacher';
  studentId?: string;
  klass?: string;
  grade?: string;
  showRealInfo: boolean;
  avatar?: string; // emoji
  bio?: string;
}

export interface ISettings {
  lang: Lang;
  accent: string;
  accent2?: string;
  bgColor: string;
  textColor: string;
  bgImage: string | null;
  bgBlur: number; // 背景图模糊 0-20 px
  scrollTopOnTab?: boolean;
  theme?: 'light' | 'dark' | 'system'; // 切 tab 自动回顶
  frosted: boolean;
  opacity: number; // 卡片不透明度 0.2-1
  parallax: boolean;
  haptics: boolean;
  pageAnim?: boolean; // 切页降落/波点聚合/模糊变清晰动画，默认开
  font: string | null;
}


export interface IAvatarFrame {
  id: string;
  name: string;
  imageUrl: string; // data URL
  unlockText: string; // how to get it
  issuedTo: string[]; // usernames who have it
  special?: boolean; // admin-issued special
  code?: string; // redemption code
  maxClaims?: number; // max number of users who can redeem
  expiresAt?: string; // ISO date
}
