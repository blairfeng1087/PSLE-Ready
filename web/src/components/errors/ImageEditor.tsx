"use client";

import { useRef, useState } from "react";
import { X, Crop, Eraser, Check, Undo2, Redo2, Sun, Sparkles } from "lucide-react";

type Mode = "crop" | "erase";
type DragEdge = "top" | "bottom" | "left" | "right" | "tl" | "tr" | "bl" | "br" | "move" | null;
const BRUSH_SIZES = [{ label: "S", size: 6 }, { label: "M", size: 14 }, { label: "L", size: 28 }];
const HANDLE_SIZE = 20;

interface Props {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIdxRef = useRef(-1);

  const [mode, setMode] = useState<Mode>("crop");
  const [brushSize, setBrushSize] = useState(24);
  const [drawing, setDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrastVal, setContrastVal] = useState(0);
  const [sharpness, setSharpness] = useState(40);
  const [autoErasing, setAutoErasing] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [hasCleaned, setHasCleaned] = useState(false);
  const beforeCleanRef = useRef<ImageData | null>(null);
  const afterCleanRef = useRef<ImageData | null>(null);
  const adjustBaseRef = useRef<ImageData | null>(null);

  // Crop box in canvas coordinates
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [cropChanged, setCropChanged] = useState(false);
  const dragEdgeRef = useRef<DragEdge>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropBoxStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  function handleImageLoad() {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!image || !canvas || !overlay) {
      requestAnimationFrame(() => handleImageLoad());
      return;
    }
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(image.naturalWidth, image.naturalHeight));
    const w = Math.round(image.naturalWidth * scale);
    const h = Math.round(image.naturalHeight * scale);
    canvas.width = w;
    canvas.height = h;
    overlay.width = w;
    overlay.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, w, h);
    adjustBaseRef.current = ctx.getImageData(0, 0, w, h);
    applyAdjustments(0, 0, 40);
    setCropBox({ x: 0, y: 0, w, h });
    pushHistory();
    setReady(true);
    drawCropOverlay({ x: 0, y: 0, w, h });
  }

  function applyAdjustments(bright: number, cont: number, sharp: number) {
    const canvas = canvasRef.current;
    const base = adjustBaseRef.current;
    if (!canvas || !base) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    const src = base.data;
    const tmp = new Uint8ClampedArray(src.length);
    const f = (259 * (cont + 255)) / (255 * (259 - cont));
    for (let i = 0; i < src.length; i += 4) {
      tmp[i] = Math.min(255, Math.max(0, f * (src[i] + bright - 128) + 128));
      tmp[i + 1] = Math.min(255, Math.max(0, f * (src[i + 1] + bright - 128) + 128));
      tmp[i + 2] = Math.min(255, Math.max(0, f * (src[i + 2] + bright - 128) + 128));
      tmp[i + 3] = src[i + 3];
    }
    if (sharp > 0) {
      const amt = sharp / 100;
      const out = new Uint8ClampedArray(tmp);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            const idx = (y * w + x) * 4 + c;
            const sharp5 = 5 * tmp[idx] - tmp[((y-1)*w+x)*4+c] - tmp[((y+1)*w+x)*4+c] - tmp[(y*w+x-1)*4+c] - tmp[(y*w+x+1)*4+c];
            out[idx] = Math.min(255, Math.max(0, tmp[idx] + amt * (sharp5 - tmp[idx])));
          }
        }
      }
      ctx.putImageData(new ImageData(out, w, h), 0, 0);
    } else {
      ctx.putImageData(new ImageData(tmp, w, h), 0, 0);
    }
  }

  // --- History ---
  function pushHistory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const arr = historyRef.current.slice(0, historyIdxRef.current + 1);
    arr.push(snap);
    if (arr.length > 30) arr.shift();
    historyRef.current = arr;
    historyIdxRef.current = arr.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }

  async function autoErase() {
    const canvas = canvasRef.current;
    if (!canvas || autoErasing) return;
    setAutoErasing(true);
    const ctx = canvas.getContext("2d")!;
    beforeCleanRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
      const form = new FormData();
      form.append("image", blob, "photo.jpg");
      const res = await fetch("/api/erase", { method: "POST", body: form });
      const data = await res.json();
      if (data.erasedImage) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const c = canvas.getContext("2d")!;
          c.drawImage(img, 0, 0);
          adjustBaseRef.current = c.getImageData(0, 0, canvas.width, canvas.height);
          setBrightness(0); setContrastVal(0); setSharpness(40);
          applyAdjustments(0, 0, 40);
          afterCleanRef.current = c.getImageData(0, 0, canvas.width, canvas.height);
          setHasCleaned(true); setShowBefore(false);
          pushHistory();
          const overlay = overlayRef.current;
          if (overlay) { overlay.width = img.width; overlay.height = img.height; }
          setCropBox({ x: 0, y: 0, w: img.width, h: img.height });
          drawCropOverlay({ x: 0, y: 0, w: img.width, h: img.height });
        };
        img.src = "data:image/png;base64," + data.erasedImage;
      }
    } catch (e) { console.error("[AutoErase]", e); }
    setAutoErasing(false);
  }

  const currentBeforeToggleRef = useRef<ImageData | null>(null);

  function showBeforeImage() {
    const canvas = canvasRef.current;
    if (!canvas || !hasCleaned || !beforeCleanRef.current) return;
    const ctx = canvas.getContext("2d")!;
    currentBeforeToggleRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(beforeCleanRef.current, 0, 0);
    setShowBefore(true);
  }

  function showAfterImage() {
    const canvas = canvasRef.current;
    if (!canvas || !currentBeforeToggleRef.current) return;
    canvas.getContext("2d")!.putImageData(currentBeforeToggleRef.current, 0, 0);
    currentBeforeToggleRef.current = null;
    setShowBefore(false);
  }

  function undo() {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const ctx = canvasRef.current?.getContext("2d");
    const snap = historyRef.current[historyIdxRef.current];
    if (ctx && snap) ctx.putImageData(snap, 0, 0);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  }

  function redo() {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const ctx = canvasRef.current?.getContext("2d");
    const snap = historyRef.current[historyIdxRef.current];
    if (ctx && snap) ctx.putImageData(snap, 0, 0);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }

  // --- Coordinate helpers ---
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx: number, cy: number;
    if ("touches" in e && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else if ("changedTouches" in e && e.changedTouches.length > 0) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; }
    else { cx = (e as React.MouseEvent).clientX; cy = (e as React.MouseEvent).clientY; }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  // --- Crop overlay ---
  function drawCropOverlay(box: { x: number; y: number; w: number; h: number }) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const ow = overlay.width, oh = overlay.height;
    ctx.clearRect(0, 0, ow, oh);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, ow, box.y);
    ctx.fillRect(0, box.y + box.h, ow, oh - box.y - box.h);
    ctx.fillRect(0, box.y, box.x, box.h);
    ctx.fillRect(box.x + box.w, box.y, ow - box.x - box.w, box.h);
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    const hs = 14;
    ctx.fillStyle = "#10B981";
    for (const [hx, hy] of [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]]) {
      ctx.beginPath(); ctx.arc(hx, hy, hs / 2, 0, Math.PI * 2); ctx.fill();
    }
    for (const [hx, hy] of [[box.x + box.w / 2, box.y], [box.x + box.w / 2, box.y + box.h], [box.x, box.y + box.h / 2], [box.x + box.w, box.y + box.h / 2]]) {
      ctx.beginPath(); ctx.arc(hx, hy, hs / 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function hitTestEdge(pos: { x: number; y: number }, box: { x: number; y: number; w: number; h: number }): DragEdge {
    const h = HANDLE_SIZE;
    const nearTop = Math.abs(pos.y - box.y) < h;
    const nearBot = Math.abs(pos.y - (box.y + box.h)) < h;
    const nearLeft = Math.abs(pos.x - box.x) < h;
    const nearRight = Math.abs(pos.x - (box.x + box.w)) < h;
    if (nearTop && nearLeft) return "tl";
    if (nearTop && nearRight) return "tr";
    if (nearBot && nearLeft) return "bl";
    if (nearBot && nearRight) return "br";
    if (nearTop) return "top";
    if (nearBot) return "bottom";
    if (nearLeft) return "left";
    if (nearRight) return "right";
    if (pos.x > box.x && pos.x < box.x + box.w && pos.y > box.y && pos.y < box.y + box.h) return "move";
    return null;
  }

  // --- Event handlers ---
  function handleDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getPos(e);
    setDrawing(true);
    if (mode === "crop") {
      const edge = hitTestEdge(pos, cropBox);
      dragEdgeRef.current = edge;
      dragStartRef.current = pos;
      cropBoxStartRef.current = { ...cropBox };
    } else {
      eraseAt(pos);
    }
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    if (mode === "crop") {
      const edge = dragEdgeRef.current;
      if (!edge) return;
      const dx = pos.x - dragStartRef.current.x;
      const dy = pos.y - dragStartRef.current.y;
      const s = cropBoxStartRef.current;
      const canvas = canvasRef.current!;
      let { x, y, w, h } = s;
      const minSize = 30;
      if (edge === "move") { x = clamp(s.x + dx, 0, canvas.width - w); y = clamp(s.y + dy, 0, canvas.height - h); }
      else if (edge === "left") { x = clamp(s.x + dx, 0, s.x + s.w - minSize); w = s.w - (x - s.x); }
      else if (edge === "right") { w = clamp(s.w + dx, minSize, canvas.width - s.x); }
      else if (edge === "top") { y = clamp(s.y + dy, 0, s.y + s.h - minSize); h = s.h - (y - s.y); }
      else if (edge === "bottom") { h = clamp(s.h + dy, minSize, canvas.height - s.y); }
      else if (edge === "tl") { x = clamp(s.x + dx, 0, s.x + s.w - minSize); y = clamp(s.y + dy, 0, s.y + s.h - minSize); w = s.w - (x - s.x); h = s.h - (y - s.y); }
      else if (edge === "tr") { w = clamp(s.w + dx, minSize, canvas.width - s.x); y = clamp(s.y + dy, 0, s.y + s.h - minSize); h = s.h - (y - s.y); }
      else if (edge === "bl") { x = clamp(s.x + dx, 0, s.x + s.w - minSize); w = s.w - (x - s.x); h = clamp(s.h + dy, minSize, canvas.height - s.y); }
      else if (edge === "br") { w = clamp(s.w + dx, minSize, canvas.width - s.x); h = clamp(s.h + dy, minSize, canvas.height - s.y); }
      const newBox = { x, y, w, h };
      setCropBox(newBox);
      setCropChanged(true);
      drawCropOverlay(newBox);
    } else {
      eraseAt(pos);
    }
  }

  function handleUp() {
    if (!drawing) return;
    setDrawing(false);
    dragEdgeRef.current = null;
    if (mode === "erase") pushHistory();
  }

  function eraseAt(pos: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const r = brushSize;
    const sampleR = r + 8;
    const sx = Math.max(0, Math.round(pos.x - sampleR));
    const sy = Math.max(0, Math.round(pos.y - sampleR));
    const sw = Math.min(canvas.width - sx, Math.round(sampleR * 2));
    const sh = Math.min(canvas.height - sy, Math.round(sampleR * 2));
    if (sw <= 0 || sh <= 0) return;
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let rr = 0, gg = 0, bb = 0, count = 0;
    const cx = pos.x - sx, cy = pos.y - sy;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist >= r && dist <= sampleR) {
          const i = (y * sw + x) * 4;
          const bright = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          if (bright > 160) {
            rr += data[i]; gg += data[i + 1]; bb += data[i + 2];
            count++;
          }
        }
      }
    }
    if (count > 0) { rr = Math.round(rr / count); gg = Math.round(gg / count); bb = Math.round(bb / count); }
    else { rr = gg = bb = 255; }
    ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Crop confirm ---
  function applyCrop() {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const { x, y, w, h } = cropBox;
    if (w < 10 || h < 10) return;
    const cropped = canvas.getContext("2d")!.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    overlay.width = w;
    overlay.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(cropped, 0, 0);
    adjustBaseRef.current = ctx.getImageData(0, 0, w, h);
    setBrightness(0);
    setContrastVal(0);
    setSharpness(0);
    setCropBox({ x: 0, y: 0, w, h });
    setCropChanged(false);
    overlay.getContext("2d")!.clearRect(0, 0, w, h);
    drawCropOverlay({ x: 0, y: 0, w, h });
    pushHistory();
  }

  // --- Done ---
  function handleDone() {
    if (cropChanged) applyCrop();
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      onSave(canvas.toDataURL("image/jpeg", 0.85));
    }, 50);
  }

  function switchMode(m: Mode) {
    if (m === "erase" && cropChanged) {
      applyCrop();
    }
    if (m === "erase") {
      const overlay = overlayRef.current;
      if (overlay) overlay.getContext("2d")!.clearRect(0, 0, overlay.width, overlay.height);
    }
    if (m === "crop") {
      const canvas = canvasRef.current;
      if (canvas) {
        const box = { x: 0, y: 0, w: canvas.width, h: canvas.height };
        setCropBox(box);
        setCropChanged(false);
        drawCropOverlay(box);
      }
    }
    setMode(m);
  }

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <img
        ref={(el) => { imgRef.current = el; if (el && el.complete && el.naturalWidth > 0 && !ready) handleImageLoad(); }}
        src={imageUrl}
        onLoad={handleImageLoad}
        onError={() => setLoadError(true)}
        className="absolute w-0 h-0 opacity-0 overflow-hidden"
      />

      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-white text-lg font-bold">Cannot load image</p>
          <button onClick={onClose} className="h-10 px-6 bg-white text-black rounded-full text-sm font-bold">Close</button>
        </div>
      ) : (<>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-3 shrink-0 ${ready ? "" : "invisible"}`}>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
          <X size={20} className="text-white" />
        </button>
        <div className="flex gap-2">
          <button onClick={() => switchMode("crop")} className={`h-9 px-4 flex items-center gap-1.5 rounded-full text-sm font-bold transition ${mode === "crop" ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>
            <Crop size={16} /> Crop
          </button>
          <button onClick={() => switchMode("erase")} className={`h-9 px-4 flex items-center gap-1.5 rounded-full text-sm font-bold transition ${mode === "erase" ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>
            <Eraser size={16} /> Erase
          </button>
          <button onClick={autoErase} disabled={autoErasing} className="h-9 px-4 flex items-center gap-1.5 rounded-full text-sm font-bold bg-white/10 text-white/70 hover:bg-white/20 transition disabled:opacity-50">
            <Sparkles size={16} className={autoErasing ? "animate-spin" : ""} /> {autoErasing ? "Erasing..." : "Auto Clean"}
          </button>
          {hasCleaned && (
            <button
              onMouseDown={showBeforeImage}
              onMouseUp={showAfterImage}
              onMouseLeave={() => { if (showBefore) showAfterImage(); }}
              onTouchStart={showBeforeImage}
              onTouchEnd={showAfterImage}
              className={`h-9 px-4 rounded-full text-sm font-bold transition ${showBefore ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
            >
              Before
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={!canUndo} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-30"><Undo2 size={16} className="text-white" /></button>
          <button onClick={redo} disabled={!canRedo} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-30"><Redo2 size={16} className="text-white" /></button>
          <button onClick={handleDone} className="h-10 px-5 flex items-center gap-1.5 bg-primary text-white rounded-full text-sm font-bold shadow-[0_3px_0_0_#059669]">
            <Check size={16} /> Done
          </button>
        </div>
      </div>

      {/* Erase toolbar */}
      {mode === "erase" && ready && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map((b) => (
              <button key={b.label} onClick={() => setBrushSize(b.size)} className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition ${brushSize === b.size ? "bg-white text-black" : "bg-white/15 text-white/70"}`}>{b.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Brightness, Contrast & Sharpness sliders */}
      {ready && (
        <div className="flex items-center justify-center gap-5 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sun size={13} className="text-white/50" />
            <input type="range" min={-60} max={60} value={brightness}
              onChange={(e) => { const v = Number(e.target.value); setBrightness(v); applyAdjustments(v, contrastVal, sharpness); }}
              className="w-24 accent-white" />
            <span className="text-[10px] text-white/40 w-5">{brightness}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white/50">◐</span>
            <input type="range" min={-60} max={60} value={contrastVal}
              onChange={(e) => { const v = Number(e.target.value); setContrastVal(v); applyAdjustments(brightness, v, sharpness); }}
              className="w-24 accent-white" />
            <span className="text-[10px] text-white/40 w-5">{contrastVal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white/50">▲</span>
            <input type="range" min={0} max={100} value={sharpness}
              onChange={(e) => { const v = Number(e.target.value); setSharpness(v); applyAdjustments(brightness, contrastVal, v); }}
              className="w-24 accent-white" />
            <span className="text-[10px] text-white/40 w-5">{sharpness}</span>
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4 pb-4">
        <div className="relative inline-block max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            className="block max-w-full max-h-[calc(100vh-200px)] rounded-xl"
            style={{ touchAction: "none" }}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
          />
          <canvas ref={overlayRef} className="absolute top-0 left-0 w-full h-full rounded-xl pointer-events-none" />
        </div>
      </div>

      {ready && (
        <p className="text-center text-white/40 text-xs pb-3">
          {mode === "crop" ? "Drag edges or corners to adjust crop area" : "Draw over text to erase it"}
        </p>
      )}
      {!ready && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-lg font-bold">Loading...</p>
        </div>
      )}
      </>)}
    </div>
  );
}
