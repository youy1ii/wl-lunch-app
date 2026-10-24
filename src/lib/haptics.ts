// 触感震动反馈（设置里可关）
export function buzz(on: boolean, pattern: number | number[] = 12) {
  if (!on) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* 静默降级 */
  }
}
