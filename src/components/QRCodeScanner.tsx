import React, { useRef, useEffect, useCallback, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, CameraOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, message, Modal } from 'antd';

interface QRCodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (qrCode: string) => void;
  validQRCodes?: string[];
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  open,
  onClose,
  onScanSuccess,
  validQRCodes = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      const qrData = code.data.trim();
      setScannedCode(qrData);

      if (validQRCodes.length === 0 || validQRCodes.includes(qrData)) {
        stopCamera();
        message.success('扫码成功！');
        onScanSuccess(qrData);
      } else {
        message.error('无效的巡检点二维码');
        setTimeout(() => setScannedCode(null), 2000);
        animationRef.current = requestAnimationFrame(scanQRCode);
      }
    } else {
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [validQRCodes, onScanSuccess, stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setScannedCode(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        animationRef.current = requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      setError('无法访问摄像头，请确保已授予摄像头权限');
      message.error('无法访问摄像头');
    }
  }, [scanQRCode]);

  const handleManualInput = () => {
    Modal.confirm({
      title: '手动输入二维码',
      content: (
        <input
          id="manual-qr-input"
          type="text"
          placeholder="请输入巡检点编号"
          className="w-full px-4 py-2 border border-dark-border rounded-lg bg-dark-bg3 text-dark-text"
        />
      ),
      onOk: () => {
        const input = document.getElementById('manual-qr-input') as HTMLInputElement;
        if (input && input.value.trim()) {
          const qrCode = input.value.trim();
          if (validQRCodes.length === 0 || validQRCodes.includes(qrCode)) {
            setScannedCode(qrCode);
            message.success('扫码成功！');
            onScanSuccess(qrCode);
          } else {
            message.error('无效的巡检点编号');
          }
        }
      },
      okText: '确定',
      cancelText: '取消',
    });
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setScannedCode(null);
      setError(null);
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md mx-4 bg-dark-bg2 rounded-xl border border-dark-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent-400" />
            扫码打卡
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-dark-bg3 text-dark-text3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-12">
              <CameraOff className="w-16 h-16 mx-auto mb-4 text-dark-text3 opacity-50" />
              <p className="text-danger mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button icon={<RefreshCw className="w-4 h-4" />} onClick={startCamera}>
                  重试
                </Button>
                <Button onClick={handleManualInput}>手动输入</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-accent-400/50 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent-400 rounded-br-lg" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-accent-400/80 animate-pulse shadow-lg shadow-accent-400/50" />
                    </div>
                  </div>
                )}

                {scannedCode && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 mx-auto mb-2 text-success" />
                      <p className="text-success font-medium">扫码成功</p>
                      <p className="text-dark-text3 text-sm font-mono">{scannedCode}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button icon={<RefreshCw className="w-4 h-4" />} onClick={startCamera} block>
                  重新扫描
                </Button>
                <Button onClick={handleManualInput} block>
                  手动输入
                </Button>
              </div>
            </>
          )}
        </div>

        {validQRCodes.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-dark-text3 text-xs mb-2">有效巡检点：</p>
            <div className="flex flex-wrap gap-1">
              {validQRCodes.map((code) => (
                <span
                  key={code}
                  className="px-2 py-0.5 bg-dark-bg3 text-dark-text2 text-xs rounded font-mono"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;
