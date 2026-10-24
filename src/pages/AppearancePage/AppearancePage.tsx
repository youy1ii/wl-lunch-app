import { useRef } from 'react';
import { ChevronLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PRESET_COLORS = ['#FF4D2E', '#FF9F1C', '#38B6FF', '#5A8F3C', '#8A4FFF', '#C13584'];

export default function AppearancePage() {
  const { settings, setSettings } = useApp();
  const navigate = useNavigate();
  const imgRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    try {
      localStorage.removeItem('wl-lunch:settings');
    } catch { /* 静默 */ }
    setSettings({
      lang: 'zh',
      accent: '#E8B923',
      bgColor: '',
      textColor: '',
      bgImage: null,
      bgBlur: 0,
      frosted: true,
      opacity: 0.82,
      parallax: true,
      haptics: true,
      font: null,
    });
    toast.success('已还原默认设置');
  };

  const onImg = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettings({ bgImage: String(reader.result) });
      toast.success(t(settings.lang, 'saved'));
    };
    reader.readAsDataURL(file);
  };

  const onFont = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const family = `Custom-${Date.now()}`;
        const ff = new FontFace(family, String(reader.result));
        ff.load().then((f) => {
          document.fonts.add(f);
          setSettings({ font: family });
          toast.success(t(settings.lang, 'saved'));
        });
      } catch {
        toast.error('字体加载失败');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">{t(settings.lang, 'appearance')}</h1>
      </div>

      <div className="card-solid flex-1 space-y-5 overflow-y-auto rounded-2xl p-4 shadow-sm">
        <div>
          <div className="mb-2 text-sm font-bold">{t(settings.lang, 'frosted')}</div>
          <div className="flex gap-2">
            {[true, false].map((f) => (
              <button
                key={String(f)}
                type="button"
                onClick={() => setSettings({ frosted: f })}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-bold',
                  settings.frosted === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                {f ? t(settings.lang, 'frosted') : t(settings.lang, 'solid')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-bold">{t(settings.lang, 'cardOpacity')}</div>
          <input
            type="range"
            min={20}
            max={100}
            value={Math.round(settings.opacity * 100)}
            onChange={(e) => setSettings({ opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">{t(settings.lang, 'accentColor')}</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-bold">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/20" style={{ background: settings.accent }} />
              {settings.accent.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSettings({ accent: color })}
                className={cn(
                  'h-9 w-9 rounded-full ring-2 ring-offset-2 transition-transform pressable',
                  settings.accent === color ? 'ring-foreground scale-110' : 'ring-transparent',
                )}
                style={{ background: color }}
              />
            ))}
            <label
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full overflow-hidden pressable"
              title="自定义主色"
            >
              <input
                type="color"
                value={settings.accent}
                onChange={(e) => setSettings({ accent: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className="h-full w-full"
                style={{ background: `conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">
                +
              </span>
            </label>
            {/* 第二个颜色（渐变副色） */}
            <label
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full overflow-hidden pressable"
              title="自定义副色（渐变）"
            >
              <input
                type="color"
                value={settings.accent2 || settings.accent}
                onChange={(e) => setSettings({ accent2: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className="h-full w-full"
                style={{ background: `conic-gradient(from 180deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">
                +
              </span>
            </label>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">第二个颜色会和主色组成渐变</p>
        </div>

        <div>
          <div className="mb-2 text-sm font-bold">{t(settings.lang, 'bgColor')}</div>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-border px-3 text-xs font-bold text-muted-foreground pressable w-fit">
            <input
              type="color"
              value={settings.bgColor || '#FFF3D6'}
              onChange={(e) => setSettings({ bgColor: e.target.value })}
              className="h-4 w-4 cursor-pointer opacity-0"
            />
            <span
              className="h-5 w-5 rounded-full ring-1 ring-black/10"
              style={{ background: settings.bgColor || '#FFF3D6' }}
            />
            自定义背景色
          </label>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">{t(settings.lang, 'textColor')}</div>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-border px-3 text-xs font-bold text-muted-foreground pressable w-fit">
            <input
              type="color"
              value={settings.textColor || '#2B1D0E'}
              onChange={(e) => setSettings({ textColor: e.target.value })}
              className="h-4 w-4 cursor-pointer opacity-0"
            />
            <span
              className="h-5 w-5 rounded-full ring-1 ring-black/10"
              style={{ background: settings.textColor || '#2B1D0E' }}
            />
            自定义文字色
          </label>
        </div>

        <div>
          <div className="mb-2 text-sm font-bold">{t(settings.lang, 'bgImage')}</div>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImg(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => imgRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-sm font-bold"
          >
            <Upload size={16} />
            {t(settings.lang, 'uploadImage')}
          </button>
        </div>

        {settings.bgImage && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm font-bold">
              <span>背景模糊</span>
              <span className="text-xs text-muted-foreground">{settings.bgBlur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={settings.bgBlur}
              onChange={(e) => setSettings({ bgBlur: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/5">
          <div className="mb-2 text-sm font-bold">外观模式</div>
          <div className="flex gap-1.5">
            {([
              { id: 'light', label: '☀️ 浅色' },
              { id: 'dark', label: '🌙 深色' },
              { id: 'system', label: '💻 跟随系统' },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSettings({ theme: t.id })}
                className={
                  (settings.theme ?? 'light') === t.id
                    ? 'flex-1 rounded-full bg-primary py-1.5 text-xs font-bold text-primary-foreground pressable'
                    : 'flex-1 rounded-full bg-muted py-1.5 text-xs font-bold text-muted-foreground pressable'
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between text-sm font-bold">
          {t(settings.lang, 'parallax')}
          <input type="checkbox" checked={settings.parallax} onChange={(e) => setSettings({ parallax: e.target.checked })} />
        </label>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('wl-lunch:settings');
            window.location.reload();
          }}
          className="w-full rounded-2xl bg-destructive/10 py-3 text-sm font-bold text-destructive pressable"
        >
          🔄 一键还原所有初始设置
        </button>
        <label className="flex items-center justify-between text-sm font-bold">
          {t(settings.lang, 'haptics')}
          <input type="checkbox" checked={settings.haptics} onChange={(e) => setSettings({ haptics: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between text-sm font-bold">
          切页自动回顶
          <input type="checkbox" checked={settings.scrollTopOnTab !== false} onChange={(e) => setSettings({ scrollTopOnTab: e.target.checked })} />
        </label>

        <div>
          <div className="mb-2 text-sm font-bold">{t(settings.lang, 'font')}</div>
          <input ref={fontRef} type="file" accept=".ttf" className="hidden" onChange={(e) => onFont(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fontRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-muted py-3 text-sm font-bold"
          >
            <Upload size={16} />
            {t(settings.lang, 'uploadFont')}
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-2 w-full rounded-2xl border border-dashed border-border py-3 text-sm font-bold text-muted-foreground pressable"
        >
          还原默认设置
        </button>
      </div>
    </div>
  );
}
