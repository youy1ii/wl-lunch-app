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
  loginWithAccountPwd: (account: string, pwd: string) => { needProfile?: boolean; admin?: boolean };
  completeProfile: (u: IUser) => void;
  logout: () => void;
  addReview: (dishId: number, tier: number, text: string) => void;
  toggleLike: (dishId: number, reviewId: number) => void;
  deleteReview: (dishId: number, reviewId: number) => void;
  replyReview: (dishId: number, reviewId: number, text: string) => void;
  addFeedback: (kind: 'suggest' | 'complain', text: string, anonymous: boolean) => void;
  replyFeedback: (id: number, reply: string) => void;
  addDish: (name: string, price: number, windowId: IDish['windowId']) => void;
  deleteDish: (id: number) => void;
  toggleDishNew: (id: number) => void;
  followees: string[];
  toggleFollow: (author: string) => void;
  frames: IAvatarFrame[];
  myFrameId: string;
  setActiveFrame: (id: string) => void;
  issueFrame: (frameId: string, username: string) => void;
  uploadFrame: (frame: Omit<IAvatarFrame, 'id' | 'issuedTo'>) => void;
  profileHeader: string;
  setHeaderImage: (url: string) => void;
  updateUserProfile: (patch: Partial<IUser>) => void;
  postAnnouncement: (title: string, body: string, imageUrl?: string, linkUrl?: string) => void;
  setBanners: (banners: IBanner[]) => void;
  setTipsQr: (qr: string | null) => void;
  unreadAnnouncement: IAnnouncement | null;
  markAnnouncementRead: (id: number) => void;
  ticker: string;
  setTicker: (text: string) => void;
  notifications: INotification[];
  myRatings: Record<number, number>;
  markAllNotificationsRead: () => void;
  sendAdminMessage: (target: string, text: string) => void;
  togglePin: (id: number) => void;
}

export const AppStore = createContext<AppStoreValue | null>(null);

export function useApp(): AppStoreValue {
  const v = useContext(AppStore);
  if (!v) throw new Error('useApp must be used inside AppStoreProvider');
  return v;
}
