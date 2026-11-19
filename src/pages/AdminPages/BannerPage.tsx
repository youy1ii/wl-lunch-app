import { useRef, useState } from 'react';
import { ImagePlus, Trash2, X, Plus } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import AdminSubPage, { AdminCard, AdminPrimaryButton, inputCls } from '@/components/AdminSubPage';
import type { IBanner } from '@/lib/types';

const TARGETS = (lang: 'zh' | 'ja' | 'en') => [
  { value: '', label: t(lang,'不跳转（纯展示）') },
  { value: '/', label: t(lang,'首页') },
  { value: '/leaderboard', label: t(lang,'排行榜') },
  { value: '/dishes', label: t(lang,'打分页') },
  { value: '/me', label: t(lang,'我的') },
  { value: '/feedback', label: t(lang,'反馈页') },
  { value: '__external__', label: t(lang,'外部链接（填下方网址）') },
];

export default function BannerPage() {
  const { banners, setBanners, settings } = useApp();
  const lang = settings.lang;
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [image, setImage] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const W = 960, H = 540;
        const scale = Math.max(W / img.width, H / img.height);
        const sx = (img.width - W / scale) / 2;
        const sy = (img.height - H / scale) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, sx, sy, W / scale, H / scale, 0, 0, W, H);
        setImage(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  };

  const addBanner = () => {
    if (!title.trim()) return;
    const url = target === '__external__' ? (externalUrl.trim() || '/') : (target || '/');
    const next: IBanner = { id: Date.now(), title: title.trim(), target: url, image: image || undefined };
    setBanners([...banners, next]).then((ok) => {
      if (ok) {
        setTitle(''); setTarget(''); setExternalUrl(''); setImage('');
        toast.success(t(lang,'海报发布成功，所有设备同步'));
      } else toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
    });
  };

  const remove = (id: number) => {
    setBanners(banners.filter((b) => b.id !== id)).then((ok) => {
      if (!ok) toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
    });
  };

  return (
    <AdminSubPage title={t(lang,'Banner 轮播')} subtitle={t(lang,'首页顶部的轮播海报，可配图、可跳转')}>
      <AdminCard>
        <label className="mb-2 block text-xs font-bold text-muted-foreground">{t(lang,'标题（无图时显示为文字 Banner）')}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(lang,'例如：祝 WLLC 公测顺利')} className={inputCls} />

        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'点击后跳转')}</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
          {TARGETS(lang).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {target === '__external__' && (
          <input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder={t(lang, '粘贴网址，如 https://example.com')}
            className={`${inputCls} mt-2`}
          />
        )}

        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'海报图（可选，自动裁剪 16:9）')}</label>
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
        {image ? (
          <div className="relative mb-3 overflow-hidden rounded-xl ring-1 ring-border">
            <img src={image} alt={t(lang,'预览')} className="h-40 w-full object-cover" />
            <button type="button" onClick={() => setImage('')} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white">
              <X size={15} />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold pressable"
        >
          <ImagePlus size={17} /> {image ? t(lang,'重新上传海报') : t(lang,'上传海报图')}
        </button>

        <div className="mt-6">
          <AdminPrimaryButton disabled={!title.trim()} onClick={addBanner}>
            <span className="inline-flex items-center gap-2"><Plus size={16} />{t(lang,'添加 Banner')}</span>
          </AdminPrimaryButton>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-4 text-sm font-black">{t(lang,'现有 Banner')}（{banners.length}）</h3>
        {banners.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t(lang,'还没有 Banner')}</p>
        ) : (
          <div className="space-y-3">
            {banners.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                {b.image ? (
                  <img src={b.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-2xl">🖼️</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{i + 1}. {b.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.target || t(lang,'纯展示')}</p>
                </div>
                <button type="button" onClick={() => remove(b.id)} className="pressable rounded-lg p-2 text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminSubPage>
  );
}
