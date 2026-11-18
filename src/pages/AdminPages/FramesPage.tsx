import { useState } from 'react';
import { ImagePlus, Sparkles, Send } from 'lucide-react';
import { useApp } from '@/lib/store-context';
import { toast } from 'sonner';
import AdminSubPage, { AdminCard, AdminPrimaryButton, inputCls } from '@/components/AdminSubPage';

export default function FramesPage() {
  const { frames: avatarFrames, issueFrame, uploadFrame } = useApp();
  const [name, setName] = useState('');
  const [unlock, setUnlock] = useState('');
  const [img, setImg] = useState('');
  const [maxClaims, setMaxClaims] = useState(100);
  const [expires, setExpires] = useState('');
  const [issueTarget, setIssueTarget] = useState('');

  const create = () => {
    if (!name.trim()) return;
    uploadFrame({
      name: name.trim(),
      unlockText: unlock.trim() || '兑换码解锁',
      imageUrl: img,
      special: true,
      maxClaims: maxClaims || 100,
      expiresAt: expires || undefined,
    }).then((ok) => {
      if (ok) {
        setName(''); setUnlock(''); setImg(''); setMaxClaims(100); setExpires('');
        toast.success('头像框上传成功');
      } else toast.error('PRTS代理指挥失败。请检查网络再次尝试');
    });
  };

  return (
    <AdminSubPage title="头像框管理" subtitle="上传新头像框 · 颁发给用户">
      <AdminCard>
        <label className="mb-2 block text-xs font-bold text-muted-foreground">框名称</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：周年限定" className={inputCls} />

        <label className="mb-2 mt-4 block text-xs font-bold text-muted-foreground">获取说明</label>
        <input value={unlock} onChange={(e) => setUnlock(e.target.value)} placeholder="例如：兑换码解锁" className={inputCls} />

        <label className="mb-2 mt-4 block text-xs font-bold text-muted-foreground">头像框图片（可选）</label>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="frame-img-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => setImg(String(r.result));
            r.readAsDataURL(f);
          }}
        />
        <div className="flex items-center gap-3">
          <label
            htmlFor="frame-img-input"
            className="pressable flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold"
          >
            <ImagePlus size={17} /> {img ? '更换图片' : '上传图片'}
          </label>
          {img && <img src={img} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary" alt="预览" />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-bold text-muted-foreground">领取人数上限</label>
            <input type="number" value={maxClaims || ''} onChange={(e) => setMaxClaims(Number(e.target.value))} placeholder="100" className={inputCls} />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold text-muted-foreground">有效期至（可选）</label>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="mt-6">
          <AdminPrimaryButton disabled={!name.trim()} onClick={create}>
            <span className="inline-flex items-center gap-2"><Sparkles size={16} /> 上传新头像框</span>
          </AdminPrimaryButton>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-4 text-sm font-black">现有头像框（{avatarFrames.length}）</h3>
        {avatarFrames.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">还没有头像框</p>
        ) : (
          <div className="space-y-3">
            {avatarFrames.map((fr) => (
              <div key={fr.id} className="rounded-xl bg-muted/60 p-3.5">
                <div className="flex items-center gap-3">
                  {fr.imageUrl ? (
                    <img src={fr.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl">✨</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{fr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      已发 {fr.issuedTo.length}/{fr.maxClaims || '∞'} 人
                      {fr.code && <span className="ml-2 rounded bg-card px-1.5 py-0.5 font-mono text-[10px]">{fr.code}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={issueTarget}
                    onChange={(e) => setIssueTarget(e.target.value)}
                    placeholder="输入对方 UID"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!issueTarget.trim()) return;
                      issueFrame(fr.id, issueTarget.trim());
                      setIssueTarget('');
                      toast.success('已颁发');
                    }}
                    className="pressable flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                  >
                    <Send size={14} /> 颁发
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminSubPage>
  );
}
