import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 统一判断"总管理员"：认 uid 00000000 或账号 WLLC2026，避免只认 uid 导致新发内容变色
export function isOwnerUser(user: { uid?: string; username?: string } | null | undefined): boolean {
  return !!user && (user.uid === '00000000' || user.username === 'WLLC2026');
}

// 判断任意作者标识是否总管理员（用于 author_uid / author_name / admin_rep 等字符串）
export function isOwnerMark(mark: string | null | undefined): boolean {
  return mark === '00000000' || mark === 'WLLC2026';
}
