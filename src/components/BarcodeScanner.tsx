import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScanner = ({ onScan, onClose, isOpen }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const codeReader = useRef<BrowserMultiFormatReader>();

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
        // Optimize scanning settings for faster detection
        codeReader.current.timeBetweenDecodingAttempts = 100; // Faster scanning
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Get video stream with enhanced quality settings for better scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      videoElement.srcObject = stream;
      
      // Set video quality attributes for better scanning
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      
      await videoElement.play();

      // Start scanning
      codeReader.current.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
        if (result) {
          const scannedText = result.getText();
          onScan(scannedText);
          stopScanning();
          onClose();
        }
        if (err && !(err.name === 'NotFoundException')) {
          console.error('Barcode scanning error:', err);
        }
      });

    } catch (err) {
      console.error('Error starting barcode scanner:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleRetry = () => {
    setError('');
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Scan Barcode</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error ? (
            <div className="text-center space-y-4">
              <div className="text-red-500 text-sm">{error}</div>
              <Button onClick={handleRetry} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{
                    imageRendering: 'crisp-edges',
                    filter: 'contrast(1.1) brightness(1.1)'
                  }}
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary bg-transparent w-3/4 h-1/2 rounded-lg"></div>
                  </div>
                )}
              </div>
              
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Position the barcode within the frame to scan</p>
                <p className="text-xs">📱 Keep steady and ensure good lighting for best results</p>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};