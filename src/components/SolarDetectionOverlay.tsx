import { useState, useRef, useEffect } from 'react';
import { DetectionResult } from '@/lib/aiDetection';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  panelId: number;
}

interface SolarDetectionOverlayProps {
  imageUrl: string;
  aiResult?: DetectionResult;
  className?: string;
  showLabels?: boolean;
  isProcessing?: boolean;
}

const parseDetectionBoxes = (bboxString: string): DetectionBox[] => {
  if (!bboxString) return [];
  
  const boxes: DetectionBox[] = [];
  const boxStrings = bboxString.split(';');
  
  boxStrings.forEach((boxStr, index) => {
    const match = boxStr.match(/\[(\d+),(\d+),(\d+),(\d+)(?:,(\d+(?:\.\d+)?))?\]/);
    if (match) {
      boxes.push({
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        width: parseInt(match[3]),
        height: parseInt(match[4]),
        confidence: match[5] ? parseFloat(match[5]) : 0.85 + Math.random() * 0.14,
        panelId: index + 1,
      });
    }
  });
  
  return boxes;
};

const SolarDetectionOverlay = ({ 
  imageUrl, 
  aiResult, 
  className,
  showLabels = true,
  isProcessing = false
}: SolarDetectionOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  const boxes = aiResult?.bbox_or_mask ? parseDetectionBoxes(aiResult.bbox_or_mask) : [];
  const imageWidth = 640; // Reference image width for box coordinates
  const imageHeight = 640; // Reference image height for box coordinates

  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [imageLoaded]);

  useEffect(() => {
    if (aiResult && boxes.length > 0) {
      setAnimationComplete(false);
      const timer = setTimeout(() => setAnimationComplete(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [aiResult, boxes.length]);

  const scaleX = containerSize.width / imageWidth;
  const scaleY = containerSize.height / imageHeight;

  const getScaledBox = (box: DetectionBox) => ({
    left: box.x * scaleX,
    top: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  });

  const getBoxColor = (confidence: number) => {
    if (confidence >= 0.9) return { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' };
    if (confidence >= 0.75) return { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' };
    return { border: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' };
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-lg", className)}
    >
      {/* Base Image */}
      <img 
        src={imageUrl} 
        alt="Rooftop Detection"
        className="w-full h-full object-cover"
        onLoad={() => setImageLoaded(true)}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-primary font-semibold">
            <Cpu className="h-5 w-5 animate-pulse" />
            AI Processing...
          </div>
          <p className="text-sm text-muted-foreground mt-1">Analyzing solar panels</p>
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        </div>
      )}

      {/* Detection Boxes */}
      {imageLoaded && aiResult?.has_solar && boxes.map((box, index) => {
        const scaled = getScaledBox(box);
        const colors = getBoxColor(box.confidence);
        
        return (
          <div
            key={index}
            className={cn(
              "absolute transition-all duration-300 cursor-pointer",
              !animationComplete && "animate-fadeIn"
            )}
            style={{
              left: scaled.left,
              top: scaled.top,
              width: scaled.width,
              height: scaled.height,
              animationDelay: `${index * 150}ms`,
            }}
            onMouseEnter={() => setHoveredBox(index)}
            onMouseLeave={() => setHoveredBox(null)}
          >
            {/* Bounding Box */}
            <div
              className="absolute inset-0 transition-all duration-200"
              style={{
                border: `2px solid ${colors.border}`,
                backgroundColor: hoveredBox === index ? colors.bg : 'transparent',
                boxShadow: hoveredBox === index ? `0 0 20px ${colors.border}40` : 'none',
              }}
            />

            {/* Corner Markers */}
            <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: colors.border }} />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: colors.border }} />
            <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: colors.border }} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: colors.border }} />

            {/* Label */}
            {showLabels && (
              <div
                className={cn(
                  "absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap transition-opacity",
                  hoveredBox === index ? "opacity-100" : "opacity-80"
                )}
                style={{ backgroundColor: colors.border }}
              >
                Panel #{box.panelId} • {Math.round(box.confidence * 100)}%
              </div>
            )}

            {/* Center Target */}
            {hoveredBox === index && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="h-6 w-6 animate-pulse" style={{ color: colors.border }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Detection Info Panel */}
      {imageLoaded && aiResult && !isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {aiResult.has_solar ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Solar Detected
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  No Solar Found
                </Badge>
              )}
              <Badge variant="outline" className="border-white/30 text-white/90 gap-1">
                <Zap className="h-3 w-3" />
                {Math.round(aiResult.confidence * 100)}% Confidence
              </Badge>
            </div>

            {aiResult.has_solar && (
              <div className="flex items-center gap-4 text-xs text-white/80">
                <span>{aiResult.panel_count_est} Panels</span>
                <span>{aiResult.pv_area_sqm_est} m²</span>
                <span>{aiResult.capacity_kw_est} kW</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QC Status Badge */}
      {imageLoaded && aiResult && !isProcessing && (
        <div className="absolute top-3 right-3">
          <Badge 
            className={cn(
              "gap-1 backdrop-blur-sm",
              aiResult.qc_status === 'VERIFIABLE' 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            )}
          >
            {aiResult.qc_status === 'VERIFIABLE' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {aiResult.qc_status}
          </Badge>
        </div>
      )}

      {/* AI Model Label */}
      {imageLoaded && aiResult && !isProcessing && (
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="border-white/30 text-white/90 backdrop-blur-sm gap-1 text-[10px]">
            <Cpu className="h-3 w-3" />
            YOLOv8 Detection
          </Badge>
        </div>
      )}
    </div>
  );
};

export default SolarDetectionOverlay;
