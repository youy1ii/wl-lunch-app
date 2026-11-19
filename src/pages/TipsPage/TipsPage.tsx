import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import SettingsHeader from '@/components/SettingsHeader';

export default function TipsPage() {
  const { tipsQr, settings } = useApp();

  return (
    <div className="flex h-full flex-col p-4">
      <SettingsHeader title={t(settings.lang, 'tips')} />
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
