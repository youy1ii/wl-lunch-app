import { useRef, useState } from 'react';
import { Megaphone, ImagePlus, X } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import AdminSubPage, { AdminCard, AdminPrimaryButton, inputCls } from '@/components/AdminSubPage';

export default function AnnouncementsPage() {
  const { postAnnouncement, settings } = useApp();
  const lang = settings.lang;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  const publish = () => {
    if (!title.trim()) return;
    postAnnouncement(title.trim(), body.trim(), image || undefined, link || undefined).then((ok) => {
      if (ok) {
        setTitle(''); setBody(''); setImage(''); setLink('');
        toast.success(t(lang,'公告发布成功，所有设备同步'));
      } else toast.error(t(lang,'PRTS代理指挥失败。请检查网络再次尝试'));
    });
  };

  return (
    <AdminSubPage title={t(lang,'公告管理')} subtitle={t(lang,'发布后学生进 App 会强制弹窗查看')}>
      <AdminCard>
        <label className="mb-2 block text-xs font-bold text-muted-foreground">{t(lang,'公告标题')}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(lang,'输入公告标题')} className={inputCls} />

        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'公告内容')}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(lang,'活动通知、菜单调整、节日祝福……')}
          className={`${inputCls} h-32 resize-none`}
        />

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => setImage(String(r.result));
            r.readAsDataURL(f);
          }}
        />
        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'配图（可选）')}</label>
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold pressable"
        >
          <ImagePlus size={17} /> {image ? t(lang,'更换配图') : t(lang,'上传配图')}
        </button>
        {image && (
          <div className="mt-3">
            <div className="relative inline-block">
              <img src={image} alt={t(lang,'预览')} className="max-h-40 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImage('')}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <label className="mb-2 mt-5 block text-xs font-bold text-muted-foreground">{t(lang,'跳转链接（可选）')}</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={t(lang, 'https://… 或站内路径')}
          className={inputCls}
        />

        <div className="mt-6">
          <AdminPrimaryButton disabled={!title.trim()} onClick={publish}>
            <span className="inline-flex items-center gap-2"><Megaphone size={16} /> {t(lang, 'postAnnounce')}</span>
          </AdminPrimaryButton>
        </div>
      </AdminCard>
    </AdminSubPage>
  );
}
