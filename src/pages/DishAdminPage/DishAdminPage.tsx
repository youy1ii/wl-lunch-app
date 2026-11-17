import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store-context';
import { WINDOWS } from '@/lib/mock-data';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import type { WindowId } from '@/lib/types';

export default function DishAdminPage() {
  const { dishes, settings, addDish, deleteDish, toggleDishNew, setDishImage, setDishMeal } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [win, setWin] = useState<WindowId>('doumian');

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-full bg-card p-2 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">菜品管理</h1>
      </div>

      <div className="card-solid rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="菜品名称" className="flex-1 rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="¥" className="w-14 rounded-lg bg-muted px-2 py-1.5 text-sm outline-none" />
          <select value={win} onChange={(e) => setWin(e.target.value as WindowId)} className="rounded-lg bg-muted px-2 text-sm">
            {WINDOWS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!name.trim() || !price) return;
              addDish(name.trim(), Number(price), win).then((ok) => {
                if (ok) { setName(''); setPrice(''); toast.success('菜品已添加'); }
                else toast.error('PRTS代理指挥失败。请检查网络再次尝试');
              });
            }}
            className="rounded-lg bg-primary p-2 text-primary-foreground"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {dishes.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1.5 text-sm">
              <label className="cursor-pointer text-xs">📷<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setDishImage(d.id, String(r.result)); r.readAsDataURL(f); }} /></label>
              <select value={d.mealType || 'lunch'} onChange={(e) => setDishMeal(d.id, e.target.value)} className="rounded bg-card px-1 text-[10px]">
                <option value="breakfast">早饭</option>
                <option value="lunch">中饭</option>
                <option value="dinner">晚饭</option>
                <option value="supper">夜宵</option>
              </select>
              <span className="flex-1 truncate px-2">
                {d.name} <span className="text-xs text-muted-foreground">¥{d.price}</span>
                {d.isNew && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">新品</span>}
              </span>
              <button
                type="button"
                onClick={() => toggleDishNew(d.id)}
                className={d.isNew ? 'rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white' : 'rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground'}
              >
                {d.isNew ? '取消新品' : '标新品'}
              </button>
              <button type="button" onClick={() => { deleteDish(d.id).then((ok) => ok ? toast.success('已删除') : toast.error('PRTS代理指挥失败。请检查网络再次尝试')); }} className="ml-2 text-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
