import { useRef } from 'react';
import { QrCode, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import AdminSubPage, { AdminCard, AdminPrimaryButton } from '@/components/AdminSubPage';

export default function TipsPage() {
  const { tipsQr, setTipsQr, settings } = useApp();
  const qrRef = useRef<HTMLInputElement>(null);

  return (
    <AdminSubPage title="赞赏码" subtitle="学生打赏时显示的收款二维码">
      <AdminCard>
        <input
          ref={qrRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => setTipsQr(String(r.result));
            r.readAsDataURL(f);
          }}
        />
        {tipsQr ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <img src={tipsQr} className="h-52 w-52 rounded-2xl object-contain ring-1 ring-border shadow-sm" alt="赞赏码" />
            <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
              <CheckCircle2 size={16} /> 已上传
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <QrCode size={52} strokeWidth={1.3} />
            <p className="text-sm">还没有上传赞赏码</p>
          </div>
        )}
        <div className="mt-6">
          <AdminPrimaryButton onClick={() => qrRef.current?.click()}>
            {tipsQr ? '更换图片' : t(settings.lang, 'uploadImage')}
          </AdminPrimaryButton>
        </div>
      </AdminCard>
    </AdminSubPage>
  );
}
