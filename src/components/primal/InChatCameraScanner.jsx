import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Zap, AlertCircle } from 'lucide-react';

export default function InChatCameraScanner({ isOpen, onClose, onDetectedCode }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const scanBufferRef = useRef({ lastCode: null, count: 0 });

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen && typeof window !== 'undefined') {
      const initScanner = async () => {
        try {
          setIsScanning(true);
          setError(null);
          scanBufferRef.current = { lastCode: null, count: 0 };

          // Pre-prompt camera permission on Android / mobile browsers
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
              });
              stream.getTracks().forEach(t => t.stop());
            } catch (err) {
              console.warn("Camera permission prompt error:", err);
            }
          }

          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
          const element = document.getElementById("in-chat-barcode-reader");
          if (!element) return;

          html5QrCode = new Html5Qrcode("in-chat-barcode-reader", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.QR_CODE
            ],
            verbose: false
          });
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 22,
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.777778
            },
            (decodedText) => {
              if (scanBufferRef.current.lastCode === decodedText) {
                scanBufferRef.current.count += 1;
              } else {
                scanBufferRef.current = { lastCode: decodedText, count: 1 };
              }

              // Confirm after 2 consecutive identical frames or immediately if valid EAN-13
              if (scanBufferRef.current.count >= 2 || (decodedText.length === 13 && /^\d+$/.test(decodedText))) {
                if (navigator.vibrate) navigator.vibrate(80);
                if (scannerRef.current) {
                  try {
                    scannerRef.current.stop();
                  } catch(e) {}
                }
                onDetectedCode(decodedText);
              }
            },
            () => {} // Silent scan error loop
          );
        } catch (err) {
          console.error("In-Chat Camera Scanner Error:", err);
          setError('Kamera-Zugriff konnte nicht gestartet werden. Bitte Berechtigung erteilen.');
          setIsScanning(false);
        }
      };

      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d0f16] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Barcode Scanner</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-zinc-400">Barcode im Sucher zentrieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-inner">
          <div id="in-chat-barcode-reader" className="w-full h-full" />
          
          {/* Laser Line Overlay */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] pointer-events-none animate-pulse" />

          {/* Corner brackets */}
          <div className="absolute inset-6 pointer-events-none border-2 border-cyan-400/40 rounded-xl" />
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-3 w-full flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Erkennt EAN, QR & Supermarkt-Codes</span>
          </span>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
