import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface CropModalProps {
  image: string;
  aspectRatio: number; // width / height, e.g. 1 for square, 21/9 for banner
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
  title?: string;
}

export default function CropModal({ image, aspectRatio, onCancel, onConfirm, title = '裁剪图片' }: CropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const containerW = 320;
  const containerH = Math.round(containerW / aspectRatio);
  const imgBaseSize = containerW;

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    const point = 'touches' in e ? e.touches[0] : e;
    lastPos.current = { x: point.clientX - pos.x, y: point.clientY - pos.y };
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    const point = 'touches' in e ? e.touches[0] : e;
    setPos({ x: point.clientX - lastPos.current.x, y: point.clientY - lastPos.current.y });
  };

  const onDragEnd = () => { dragging.current = false; };

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = containerW * 2;
    canvas.height = containerH * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scaledW = imgBaseSize * zoom;
      const scaledH = (img.height / img.width) * scaledW;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(2, 2);
      ctx.drawImage(
        img,
        containerW / 2 - scaledW / 2 + pos.x,
        containerH / 2 - scaledH / 2 + pos.y,
        scaledW,
        scaledH
      );
      ctx.restore();
      onConfirm(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">{title}</h3>
          <button type="button" onClick={onCancel} className="pressable rounded-full bg-white/20 p-1 text-white"><X size={16} /></button>
        </div>

        {/* Crop area */}
        <div
          ref={containerRef}
          className={"relative mx-auto overflow-hidden bg-black " + (aspectRatio === 1 ? "rounded-full" : "rounded-xl")}
          style={{ width: containerW, height: containerH }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <img
            src={image}
            alt=""
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            draggable={false}
            style={{
              width: imgBaseSize * zoom,
              height: 'auto',
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
            }}
          />
          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 border-2 border-white/60">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/30" />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-white/60">1x</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-white/60">4x</span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="pressable flex-1 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white">取消</button>
          <button type="button" onClick={handleConfirm} className="pressable flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground">
            <Check size={16} className="mr-1 inline" />确认
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
