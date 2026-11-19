// 触感反馈（外观页可关）：
// - Android / 其他支持 Vibration API 的浏览器：navigator.vibrate(pattern)
// - iOS Safari：无 Vibration API，使用隐藏的 <input type="checkbox" switch> + 点击关联 label
//   触发系统 Taptic Engine（iOS 17.4+ 可用的网页震动手法）。
// - 桌面/不支持的设备：静默降级，不报错。

type BuzzPattern = number | number[];

let iosNodes: { input: HTMLInputElement; label: HTMLLabelElement } | null = null;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ 的 UA 伪装成 Mac，需要 maxTouchPoints 辅助判断
  return /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function ensureIOSSwitch() {
  if (iosNodes) return iosNodes;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.id = `wb-haptic-${Math.random().toString(36).slice(2, 8)}`;
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  // 必须留在可布局的文档里，display:none 时 iOS 不触发触感
  input.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  const label = document.createElement('label');
  label.htmlFor = input.id;
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(input);
  document.body.appendChild(label);
  iosNodes = { input, label };
  return iosNodes;
}

function iosTick() {
  try {
    ensureIOSSwitch().label.click();
  } catch {
    /* 静默降级 */
  }
}

/** 触发一次触感。on=false 时完全不动作。 */
export function buzz(on: boolean, pattern: BuzzPattern = 12) {
  if (!on) return;
  try {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return;
    if (isIOS()) {
      iosTick();
      // 多段 pattern 视为「加强反馈」：iOS 上再补一记短促触感
      if (Array.isArray(pattern) && pattern.length > 1) window.setTimeout(iosTick, 28);
      return;
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* 静默降级 */
  }
}
