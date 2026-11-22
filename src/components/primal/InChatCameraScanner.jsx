import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Zap, AlertCircle, Maximize2 } from 'lucide-react';

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

          // Pre-prompt HD rear camera permission with continuous autofocus
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: { ideal: 'environment' },
                  width: { min: 1280, ideal: 1920 },
                  height: { min: 720, ideal: 1080 }
                }
              });
              stream.getTracks().forEach(t => t.stop());
            } catch (err) {
              console.warn("Camera permission prompt warning:", err);
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
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.DATA_MATRIX
            ],
            verbose: false,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          });
          scannerRef.current = html5QrCode;

          // Start scanning with High-Res 1080p configuration and large responsive scan window
          await html5QrCode.start(
            {
              facingMode: "environment"
            },
            {
              fps: 25,
              // Wide & generous scanning box for instant auto-detection without precision aiming
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const width = Math.floor(viewfinderWidth * 0.85);
                const height = Math.floor(Math.min(viewfinderHeight * 0.75, 320));
                return { width: Math.max(width, 280), height: Math.max(height, 200) };
              },
              aspectRatio: 1.333333
            },
            (decodedText) => {
              if (scanBufferRef.current.lastCode === decodedText) {
                scanBufferRef.current.count += 1;
              } else {
                scanBufferRef.current = { lastCode: decodedText, count: 1 };
              }

              // Confirm immediately for valid EAN-13, EAN-8 or after 2 consecutive frames
              if (
                scanBufferRef.current.count >= 2 ||
                ((decodedText.length === 13 || decodedText.length === 8) && /^\d+$/.test(decodedText))
              ) {
                if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                if (scannerRef.current) {
                  try {
                    scannerRef.current.stop();
                  } catch(e) {}
                }
                onDetectedCode(decodedText);
              }
            },
            () => {} // Silent scan tick
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#090b10] border border-cyan-500/50 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Camera className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>HD Barcode & Food Scanner</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Halte Barcode oder QR-Code einfach vor die Linse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big HD Camera Viewfinder (4:3 aspect ratio, min-h-[360px] up to 480px on desktop) */}
        <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-2xl">
          <div id="in-chat-barcode-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          
          {/* Laser Line Overlay with Dynamic Sci-Fi Glow */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#22d3ee] pointer-events-none animate-pulse" />

          {/* Corner Viewfinder Targeting Guides */}
          <div className="absolute inset-4 sm:inset-6 pointer-events-none border-2 border-cyan-400/30 rounded-2xl flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <span className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
              <span className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            </div>
            <div className="flex justify-between">
              <span className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
              <span className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
            </div>
          </div>

          {/* Center Hint Badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 pointer-events-none">
            Auto-Fokus aktiv • EAN-13, EAN-8 & QR
          </div>
        </div>

        {error && (
          <div className="mt-3 w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-3 w-full flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Erkennt Supermarkt-Barcodes blitzschnell</span>
          </span>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
