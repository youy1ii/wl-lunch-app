import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';

export default function TipsPage() {
  const { tipsQr, settings } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">{t(settings.lang, 'tips')}</h1>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-black">{t(settings.lang, 'tipsTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t(settings.lang, 'tipsSub')}</p>
        <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-card p-4 shadow-sm">
          {tipsQr ? (
            <img src={tipsQr} alt="QR" className="h-full w-full object-contain" />
          ) : (
            <span className="text-center text-sm text-muted-foreground">{t(settings.lang, 'tipsQrPlaceholder')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
