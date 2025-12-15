import { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  getMapboxToken, 
  setMapboxToken, 
  hasMapboxToken,
  validateMapboxToken 
} from '@/lib/satelliteImagery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Loader2,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Navigation,
  Crosshair,
  LocateFixed
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MapLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

const MapLocationPicker = ({
  latitude,
  longitude,
  onLocationSelect,
  className
}: MapLocationPickerProps) => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasToken, setHasToken] = useState(hasMapboxToken());
  const [tokenInput, setTokenInput] = useState('');
  const [validatingToken, setValidatingToken] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [locating, setLocating] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !hasToken) return;

    const token = getMapboxToken();
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: longitude && latitude ? [longitude, latitude] : [78.9629, 20.5937], // Default to India center
      zoom: longitude && latitude ? 16 : 5,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add initial marker if coordinates exist
      if (latitude && longitude && map.current) {
        addMarker(latitude, longitude);
      }
    });

    // Click handler to select location
    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      addMarker(lat, lng);
      setCurrentCoords({ lat, lng });
      onLocationSelect(lat, lng);
      
      toast({
        title: 'Location Selected',
        description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [hasToken]);

  // Update marker when external coordinates change
  useEffect(() => {
    if (latitude && longitude && map.current && mapLoaded) {
      addMarker(latitude, longitude);
      setCurrentCoords({ lat: latitude, lng: longitude });
      
      // Fly to location
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 1500,
      });
    }
  }, [latitude, longitude, mapLoaded]);

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #f59e0b, #ea580c);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5);
        border: 3px solid white;
        animation: markerBounce 0.5s ease-out;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">📍</div>
      </div>
    `;

    marker.current = new mapboxgl.Marker(el, { anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

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

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 2000,
          });
          
          addMarker(lat, lng);
          setCurrentCoords({ lat, lng });
          onLocationSelect(lat, lng);
        }
        
        toast({
          title: 'Location Found',
          description: `Your location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        setLocating(false);
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: 'Could not get your location. Please try again.',
          variant: 'destructive',
        });
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCenterOnIndia = () => {
    if (map.current) {
      map.current.flyTo({
        center: [78.9629, 20.5937],
        zoom: 5,
        duration: 1500,
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Interactive Map Picker
        </Label>
        
        <div className="flex items-center gap-2">
          {hasToken ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
              <CheckCircle className="h-3 w-3" />
              Map Ready
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
                  <MapPin className="h-5 w-5 text-primary" />
                  Mapbox Configuration
                </DialogTitle>
                <DialogDescription>
                  Enter your Mapbox public token to enable the map picker
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mapbox-token-picker">Public Access Token</Label>
                  <Input
                    id="mapbox-token-picker"
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

      {/* Map Container */}
      <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/30">
        {!hasToken ? (
          <div className="p-8 text-center h-64 flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Configure Mapbox to use the interactive map
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
        ) : (
          <div className="relative">
            <div ref={mapContainer} className="h-64 w-full" />
            
            {/* Map Controls Overlay */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 bg-white/90 hover:bg-white shadow-md"
                onClick={handleLocateMe}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LocateFixed className="h-3 w-3" />
                )}
                My Location
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 bg-white/90 hover:bg-white shadow-md"
                onClick={handleCenterOnIndia}
              >
                <Navigation className="h-3 w-3" />
                India
              </Button>
            </div>

            {/* Crosshair Hint */}
            {!currentCoords && mapLoaded && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Crosshair className="h-4 w-4" />
                  Click on the map to select location
                </div>
              </div>
            )}

            {/* Selected Coordinates */}
            {currentCoords && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-black/70 text-white border-0 gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {hasToken && (
        <p className="text-xs text-muted-foreground text-center">
          Click anywhere on the map to select a location • Zoom in for accuracy
        </p>
      )}

      {/* CSS for marker animation */}
      <style>{`
        @keyframes markerBounce {
          0% { transform: rotate(-45deg) translateY(-20px); opacity: 0; }
          50% { transform: rotate(-45deg) translateY(5px); }
          100% { transform: rotate(-45deg) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MapLocationPicker;
