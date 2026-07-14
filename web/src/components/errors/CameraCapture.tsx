"use client";

import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ open, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReady(false);
    setError("");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setError("Cannot access camera. Please allow camera permission."));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.92);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">
        <X size={20} className="text-white" />
      </button>

      {error ? (
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <button onClick={onClose} className="h-11 px-6 bg-white text-black rounded-2xl text-sm font-bold">Close</button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-[720px] aspect-[4/3] rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/60 text-sm">Starting camera...</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-6">
            <button onClick={onClose} className="text-white/60 text-sm font-semibold hover:text-white transition">Cancel</button>
            <button
              onClick={capture}
              disabled={!ready}
              className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30 transition hover:scale-105 active:scale-95"
            >
              <div className="w-[58px] h-[58px] rounded-full bg-white" />
            </button>
            <span className="w-12" />
          </div>

          <p className="text-white/40 text-xs mt-4">Align the exam paper within the frame</p>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
