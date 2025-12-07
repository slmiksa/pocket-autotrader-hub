import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer = ({ src, alt, isOpen, onClose }: ImageViewerProps) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0 overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Controls */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/10 h-8 w-8"
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-white text-sm min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/10 h-8 w-8"
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-4 bg-white/30" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="text-white hover:bg-white/10 h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Image */}
        <div 
          className="flex items-center justify-center w-full h-full min-h-[60vh] overflow-auto p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <img
            src={src}
            alt={alt || 'Image'}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${scale})` }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to use image viewer
export const useImageViewer = () => {
  const [viewerState, setViewerState] = useState<{ src: string; alt?: string } | null>(null);

  const openViewer = (src: string, alt?: string) => {
    setViewerState({ src, alt });
  };

  const closeViewer = () => {
    setViewerState(null);
  };

  const ImageViewerComponent = viewerState ? (
    <ImageViewer
      src={viewerState.src}
      alt={viewerState.alt}
      isOpen={true}
      onClose={closeViewer}
    />
  ) : null;

  return {
    openViewer,
    closeViewer,
    ImageViewerComponent,
  };
};
