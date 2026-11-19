import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 统一时间显示：数据库存 UTC ISO，本 App 面向中国用户，一律按北京时间(Asia/Shanghai)显示，
// 不受设备系统时区影响，避免境外/错误时区设备上时间差 8 小时。
const TZ = 'Asia/Shanghai';
const p2 = (n: number) => String(n).padStart(2, '0');

/** 解析服务端时间。
 * Supabase 的 created_at 是 timestamp without time zone，返回 "2026-11-19T17:24:27.96878"：
 * 数值是 UTC 时刻，但字符串不带 Z/偏移。JS 的 new Date() 会把这种无后缀 ISO 按设备本地时区
 * （中国设备 GMT+8）解析，结果少 8 小时，界面显示成前一天 17 点。这里补 Z 强制按 UTC 解析。 */
export function parseServerDate(v: string | number | Date): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    return new Date(s + 'Z');
  }
  return new Date(s);
}

/** 把 ISO/时间戳按北京时间格式化：month-day hour:minute，如 11-20 01:24 */
export function fmtBJT(iso: string | number | Date | undefined | null, withDate = true): string {
  if (!iso) return '';
  const d = parseServerDate(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 16);
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((x) => x.type === t)?.value || '';
  const hm = `${get('hour')}:${get('minute')}`;
  return withDate ? `${get('month')}-${get('day')} ${hm}` : hm;
}

/** 判断两个时间点是否在北京时间下的同一天 */
export function sameBJTDay(a: string | number | Date | undefined | null, b: string | number | Date | undefined | null): boolean {
  const f = (v: string | number | Date | undefined | null) => {
    if (!v) return '';
    const d = parseServerDate(v);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  };
  return f(a) === f(b);
}

// 统一判断"总管理员"：认 uid 00000000 或账号 WLLC2026，避免只认 uid 导致新发内容变色
export function isOwnerUser(user: { uid?: string; username?: string } | null | undefined): boolean {
  return !!user && (user.uid === '00000000' || user.username === 'WLLC2026');
}

// 判断任意作者标识是否总管理员（用于 author_uid / author_name / admin_rep 等字符串）
export function isOwnerMark(mark: string | null | undefined): boolean {
  return mark === '00000000' || mark === 'WLLC2026';
}
