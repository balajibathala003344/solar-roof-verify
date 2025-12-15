import { useState, useEffect, useCallback } from 'react';
import { 
  getSatelliteImageUrl, 
  hasMapboxToken, 
  setMapboxToken,
  validateMapboxToken,
  getMapboxToken
} from '@/lib/satelliteImagery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Satellite,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MapPin,
  Settings,
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SatelliteImageFetcherProps {
  latitude: number | null;
  longitude: number | null;
  onImageFetched?: (imageUrl: string) => void;
  className?: string;
}

const SatelliteImageFetcher = ({ 
  latitude, 
  longitude, 
  onImageFetched,
  className 
}: SatelliteImageFetcherProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(hasMapboxToken());
  const [tokenInput, setTokenInput] = useState('');
  const [validatingToken, setValidatingToken] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(18);

  const canFetch = latitude !== null && longitude !== null && hasToken;

  const fetchImage = useCallback(async () => {
    if (!latitude || !longitude || !hasToken) return;

    setLoading(true);
    try {
      const url = getSatelliteImageUrl({
        latitude,
        longitude,
        zoom,
        width: 640,
        height: 640,
      });

      if (url) {
        // Test if the URL works
        const response = await fetch(url);
        if (response.ok) {
          setImageUrl(url);
          onImageFetched?.(url);
          toast({
            title: 'Satellite Image Loaded',
            description: 'High-resolution rooftop imagery fetched successfully.',
          });
        } else {
          throw new Error('Failed to fetch image');
        }
      }
    } catch (error) {
      console.error('Error fetching satellite image:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Could not load satellite imagery. Please check your API token.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, zoom, hasToken, onImageFetched, toast]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      toast({
        title: 'Token Required',
        description: 'Please enter your Mapbox public token.',
        variant: 'destructive',
      });
      return;
    }

    setValidatingToken(true);
    const isValid = await validateMapboxToken(tokenInput.trim());
    
    if (isValid) {
      setMapboxToken(tokenInput.trim());
      setHasToken(true);
      setShowSettings(false);
      toast({
        title: 'Token Saved',
        description: 'Mapbox token configured successfully.',
      });
    } else {
      toast({
        title: 'Invalid Token',
        description: 'The token could not be validated. Please check and try again.',
        variant: 'destructive',
      });
    }
    setValidatingToken(false);
  };

  const handleZoomChange = (delta: number) => {
    setZoom(prev => Math.min(20, Math.max(14, prev + delta)));
  };

  useEffect(() => {
    // Auto-fetch when coordinates change and token is available
    if (canFetch && latitude && longitude) {
      fetchImage();
    }
  }, [latitude, longitude, canFetch]);

  // Re-fetch when zoom changes
  useEffect(() => {
    if (imageUrl && canFetch) {
      fetchImage();
    }
  }, [zoom]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Satellite className="h-4 w-4 text-primary" />
          Satellite Imagery
        </Label>
        
        <div className="flex items-center gap-2">
          {hasToken ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
              <CheckCircle className="h-3 w-3" />
              Mapbox Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
              <AlertCircle className="h-3 w-3" />
              Setup Required
            </Badge>
          )}
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5 text-primary" />
                  Mapbox Configuration
                </DialogTitle>
                <DialogDescription>
                  Enter your Mapbox public token to enable satellite imagery
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mapbox-token">Public Access Token</Label>
                  <Input
                    id="mapbox-token"
                    type="password"
                    placeholder="pk.eyJ1Ijo..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your token is stored locally and never sent to our servers.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <a 
                    href="https://account.mapbox.com/access-tokens/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Get your token from Mapbox
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <Button 
                  onClick={handleSaveToken} 
                  className="w-full gap-2"
                  disabled={validatingToken}
                >
                  {validatingToken ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Save Token
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Satellite Image Display */}
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/30">
        {!hasToken ? (
          <div className="p-8 text-center">
            <Satellite className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Configure Mapbox to fetch satellite imagery
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Setup Mapbox
            </Button>
          </div>
        ) : !latitude || !longitude ? (
          <div className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Enter coordinates to fetch satellite image
            </p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 animate-ping absolute inset-0" />
              <Loader2 className="h-16 w-16 text-primary animate-spin relative" />
            </div>
            <p className="text-muted-foreground mt-4">Fetching satellite imagery...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        ) : imageUrl ? (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Satellite view of rooftop"
              className="w-full h-64 object-cover"
            />
            
            {/* Overlay Controls */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge className="bg-black/70 text-white border-0 gap-1">
                <Satellite className="h-3 w-3" />
                Mapbox Satellite
              </Badge>
              <Badge variant="outline" className="bg-white/90 text-foreground border-0 text-xs">
                Zoom: {zoom}x
              </Badge>
            </div>
            
            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={() => handleZoomChange(1)}
                disabled={zoom >= 20}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={() => handleZoomChange(-1)}
                disabled={zoom <= 14}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 bg-white/90 hover:bg-white"
                onClick={fetchImage}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <p className="text-muted-foreground mb-2">
              Could not load satellite imagery
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchImage}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
      
      {hasToken && imageUrl && (
        <p className="text-xs text-muted-foreground text-center">
          Imagery © Mapbox © OpenStreetMap
        </p>
      )}
    </div>
  );
};

export default SatelliteImageFetcher;
