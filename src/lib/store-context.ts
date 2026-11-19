// EXPORTS: AppStore (context + hook), AppStoreValue

import { createContext, useContext } from 'react';
import type {
  IBanner,
  IDish,
  IFeedback,
  IAnnouncement,
  INotification,
  ISettings,
  IUser,
  IAvatarFrame,
} from './types';

export interface AppStoreValue {
  user: IUser | null;
  isAdmin: boolean;
  dishes: IDish[];
  announcements: IAnnouncement[];
  banners: IBanner[];
  feedbacks: IFeedback[];
  tipsQr: string | null;
  settings: ISettings;
  setSettings: (patch: Partial<ISettings>) => void;
  loginWithPhone: (phone: string) => { needProfile: boolean } | { bad: string };
  loginWithWechat: () => { needProfile: boolean };
  loginWithAccountPwd: (account: string, pwd: string) => Promise<{ needProfile?: boolean; admin?: boolean; bad?: string }>;
  completeProfile: (u: IUser) => void;
  logout: () => void;
  addReview: (dishId: number, tier: number, text: string) => Promise<boolean>;
  toggleLike: (dishId: number, reviewId: number) => void;
  deleteReview: (dishId: number, reviewId: number) => Promise<boolean>;
  updateReview: (dishId: number, reviewId: number, newText: string) => void;
  replyReview: (dishId: number, reviewId: number, text: string) => void;
  addFeedback: (kind: 'suggest' | 'complain', text: string, anonymous: boolean) => Promise<boolean>;
  replyFeedback: (id: number, reply: string) => Promise<boolean>;
  addDish: (name: string, price: number, windowId: IDish['windowId']) => Promise<boolean>;
  deleteDish: (id: number) => Promise<boolean>;
  banUser: (uid: string) => Promise<boolean>;
  toggleDishNew: (id: number) => void;
  setDishImage: (id: number, url: string) => void;
  setDishMeal: (id: number, meal: string) => void;
  setDishTags: (id: number, tags: string[]) => void;
  followees: string[];
  toggleFollow: (author: string) => void;
  frames: IAvatarFrame[];
  myFrameId: string;
  setActiveFrame: (id: string) => void;
  issueFrame: (frameId: string, username: string) => void;
  uploadFrame: (frame: Omit<IAvatarFrame, 'id' | 'issuedTo' | 'code'> & { code?: string; maxClaims?: number; expiresAt?: string }) => Promise<boolean>;
  redeemFrameCode: (code: string, username: string) => { ok: boolean; msg: string; frameId?: string };
  generateFrameCode: () => string;
  profileHeader: string;
  setHeaderImage: (url: string) => void;
  updateUserProfile: (patch: Partial<IUser>) => Promise<boolean>;
  postAnnouncement: (title: string, body: string, imageUrl?: string, linkUrl?: string) => Promise<boolean>;
  setBanners: (banners: IBanner[]) => Promise<boolean>;
  setTipsQr: (qr: string | null) => void;
  unreadAnnouncement: IAnnouncement | null;
  markAnnouncementRead: (id: number) => void;
  ticker: string;
  setTicker: (text: string) => Promise<boolean>;
  notifications: INotification[];
  myRatings: Record<number, number>;
  wants: number[];
  toggleWant: (id: number) => void;
  markAllNotificationsRead: () => void;
  sendAdminMessage: (target: string, text: string) => Promise<boolean>;
  togglePin: (id: number) => void;
  savedAccounts: { user: IUser; isAdmin: boolean }[];
  switchAccount: (uid: string) => void;
  hideBottomNav: boolean;
  setHideBottomNav: (v: boolean) => void;
}

export const AppStore = createContext<AppStoreValue | null>(null);

export function useApp(): AppStoreValue {
  const v = useContext(AppStore);
  if (!v) throw new Error('useApp must be used inside AppStoreProvider');
  return v;
}
