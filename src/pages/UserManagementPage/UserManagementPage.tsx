import { ChevronLeft, ShieldBan, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user, banUser, sendAdminMessage } = useApp();
  const isOwner = user?.uid === '00000000';
  const [targetUid, setTargetUid] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">👤 用户管理</h1>
      </div>

      <div className="space-y-3 overflow-y-auto">
        <div className="card-solid rounded-2xl p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black">封禁 / 私信用户</h2>
          <div className="space-y-2">
            <input
              placeholder="输入用户UID（如 00000001）"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="w-full rounded-lg bg-muted px-3 py-2 text-sm outline-none"
            />
            <textarea
              placeholder="私信内容（可选）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-20 w-full rounded-lg bg-muted p-3 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!targetUid.trim()) { toast.error('请输入UID'); return; }
                  banUser(targetUid.trim()).then((ok) => {
                    if (ok) { toast.success(`已封禁用户 ${targetUid.trim()}`); setTargetUid(''); setMessage(''); }
                    else toast.error('封禁失败，请检查 UID 后重试');
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive py-2.5 text-xs font-bold text-destructive-foreground pressable"
              >
                <ShieldBan size={14} />
                封禁账号
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!targetUid.trim()) { toast.error('请输入UID'); return; }
                  if (!message.trim()) { toast.error('请输入私信内容'); return; }
                  sendAdminMessage(targetUid.trim(), message.trim()).then((ok) => {
                    if (ok) { toast.success(`已发送私信给 ${targetUid.trim()}`); setTargetUid(''); setMessage(''); }
                    else toast.error('发送失败，请检查 UID 后重试');
                  });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground pressable"
              >
                <Send size={14} />
                发送私信
              </button>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="card-solid rounded-2xl p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-black">说明</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              • 封禁后该用户将无法登录<br/>
              • 私信会以管理员身份发送给指定用户<br/>
              • 此页面仅管理员可见
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
