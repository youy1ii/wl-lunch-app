import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/store-context';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { IUser } from '@/lib/types';

export default function LoginPage() {
  const { settings, loginWithAccountPwd, completeProfile, isAdmin } = useApp();
  const lang = settings.lang;

  const [account, setAccount] = useState('');
  const [pwd, setPwd] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'login' | 'reg1' | 'reg2'>('login');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [realName, setRealName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [klass, setKlass] = useState('');
  const [grade, setGrade] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [err, setErr] = useState('');

  if (isAdmin) return null;

  const handleLogin = async () => {
    if (!account.trim() || !pwd.trim()) { setErr('请输入账号和密码'); return; }
    const r = await loginWithAccountPwd(account, pwd);
    if (r.bad) { setErr(r.bad); return; }
    if (r.admin) return;
    if (r.needProfile) setStep('reg2');
  };

  const handleReg1 = () => {
    if (!account.trim() || !pwd.trim() || !nickname.trim()) { setErr('请填完整'); return; }
    setStep('reg2');
  };

  const handleReg2 = async () => {
    if (!realName.trim()) { setErr('请填真实姓名'); return; }
    let finalRole: 'student' | 'teacher' = role;
    const code = inviteCode.trim().toUpperCase();
    if (code) {
      // 邀请码存数据库，任意设备可用；一次性，用后标记 used_by/used_at
      const { data: found, error: qErr } = await supabase
        .from('invite_codes')
        .select('id, code, used_by')
        .eq('code', code)
        .maybeSingle();
      if (qErr || !found) { setErr(t(lang, 'errInvite') || '邀请码无效'); return; }
      if (found.used_by) { setErr('该邀请码已被使用'); return; }
      const { error: uErr } = await supabase
        .from('invite_codes')
        .update({ used_by: account.trim() || nickname.trim(), used_at: new Date().toISOString() })
        .eq('id', found.id)
        .is('used_by', null);
      if (uErr) { setErr('邀请码校验失败，请重试'); return; }
      finalRole = 'teacher';
    } else if (role === 'teacher') {
      setErr('老师注册需要邀请码'); return;
    }
    const u: IUser = {
      username: account.trim() || nickname.trim(),
      realName: realName.trim(),
      role: finalRole,
      studentId: finalRole === 'student' ? studentId : undefined,
      klass: finalRole === 'student' ? klass : undefined,
      grade: finalRole === 'student' ? grade : undefined,
      showRealInfo: false,
    };
    completeProfile(u);
  };

  const grades = Array.from({ length: 2026 - 1994 + 1 }, (_, i) => String(2026 - i));

  return (
    <div className="dots-bg flex h-full flex-col items-center justify-center bg-background p-6">
      <div className="anim-rise mb-8 text-center" style={{ animationDelay: '100ms' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Lunch Company" className="mx-auto w-48 rounded-2xl shadow-xl" />
        <h1 className="mt-4 text-xl font-black">{t(lang, 'appName')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">一款由学生同人社团开发的<br/>上海市文来高中食堂APP</p>
      </div>

      {step === 'login' && (
        <div className="card-solid anim-pop w-full max-w-sm rounded-2xl p-5 shadow" style={{ animationDelay: '300ms' }}>
          <div className="space-y-3">
            <Input placeholder="账号" value={account} onChange={(e) => setAccount(e.target.value)} />
            <Input placeholder="密码" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <Button type="button" className="w-full" onClick={handleLogin}>登录</Button>
            <button type="button" className="w-full text-center text-xs text-primary underline" onClick={() => { setStep('reg1'); setErr(''); }}>
              没有账号？点这里注册
            </button>
            {err && <p className="text-center text-xs text-destructive">{err}</p>}
          </div>
        </div>
      )}

      {step === 'reg1' && (
        <div className="card-solid anim-pop w-full max-w-sm rounded-2xl p-5 shadow">
          <h2 className="mb-3 text-center text-sm font-black">注册新账号</h2>
          <div className="space-y-2">
            <Input placeholder="账号（登录用）" value={account} onChange={(e) => setAccount(e.target.value)} />
            <Input placeholder="密码" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <Input placeholder="昵称（别人看到的名字）" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <Button type="button" className="w-full" onClick={handleReg1}>下一步</Button>
            <button type="button" className="w-full text-center text-xs text-muted-foreground" onClick={() => setStep('login')}>返回登录</button>
            {err && <p className="text-center text-xs text-destructive">{err}</p>}
          </div>
        </div>
      )}

      {step === 'reg2' && (
        <div className="card-solid anim-pop w-full max-w-sm rounded-2xl p-5 shadow">
          <p className="mb-3 text-center text-sm font-bold">完善个人信息</p>
          <div className="mb-3 flex gap-2">
            <Button type="button" variant={role === 'student' ? 'default' : 'secondary'} className="flex-1" onClick={() => setRole('student')}>我是学生</Button>
            <Button type="button" variant={role === 'teacher' ? 'default' : 'secondary'} className="flex-1" onClick={() => setRole('teacher')}>我是老师</Button>
          </div>
          <div className="mb-3 rounded-xl bg-amber-50 p-3 text-center text-xs font-bold text-amber-700">
            ⚠️ 注册完成后真实姓名/学号/班级等信息不可修改，请仔细确认！
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-xs font-bold text-muted-foreground">邀请码（选填，输入即可成为管理员）</label>
            <Input placeholder="选填" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">真实姓名</label>
              <Input value={realName} onChange={(e) => setRealName(e.target.value)} />
            </div>
            {role === 'student' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">学号</label>
                  <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">班级</label>
                    <Input placeholder="如 3班" value={klass} onChange={(e) => setKlass(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">年级</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">选择年级</option>
                      {grades.map(g => <option key={g} value={g}>{g}级</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <p className="text-center text-[10px] text-muted-foreground">本数据不会公开展示，仅用于管理</p>
            <Button type="button" className="w-full" onClick={handleReg2}>完成注册</Button>
            {err && <p className="text-center text-xs text-destructive">{err}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
