import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Application } from '@/lib/applicationService';
import { getMapboxToken, hasMapboxToken, setMapboxToken, validateMapboxToken } from '@/lib/satelliteImagery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Map, Settings, Loader2, MapPin, Layers } from 'lucide-react';

interface RegionHeatmapProps {
  applications: Application[];
}

const RegionHeatmap = ({ applications }: RegionHeatmapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasToken, setHasToken] = useState(hasMapboxToken());
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [stats, setStats] = useState({ installations: 0, avgCapacity: 0 });

  // Prepare GeoJSON data from applications
  const geoJsonData = {
    type: 'FeatureCollection' as const,
    features: applications
      .filter(app => app.latitude && app.longitude)
      .map(app => ({
        type: 'Feature' as const,
        properties: {
          id: app.id,
          region: app.region || 'Unknown',
          status: app.status,
          hasSolar: app.aiResult?.has_solar || false,
          capacity: app.aiResult?.capacity_kw_est || 0,
          confidence: app.aiResult?.confidence || 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [app.longitude!, app.latitude!],
        },
      })),
  };

  useEffect(() => {
    if (!mapContainer.current || !hasToken || map.current) return;

    const token = getMapboxToken();
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937], // Center of India
      zoom: 4,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add heatmap source
      map.current.addSource('installations', {
        type: 'geojson',
        data: geoJsonData,
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'installations-heat',
        type: 'heatmap',
        source: 'installations',
        maxzoom: 12,
        paint: {
          // Increase weight based on capacity
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'capacity'],
            0, 0.5,
            10, 1,
          ],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            12, 3,
          ],
          // Color ramp for heatmap
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, 'rgb(103, 169, 207)',
            0.4, 'rgb(209, 229, 240)',
            0.6, 'rgb(253, 219, 199)',
            0.8, 'rgb(239, 138, 98)',
            1, 'rgb(178, 24, 43)',
          ],
          // Adjust radius based on zoom
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 15,
            12, 30,
          ],
          // Decrease opacity at higher zoom levels
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            12, 0.6,
          ],
        },
      });

      // Add circle layer for individual points at higher zoom
      map.current.addLayer({
        id: 'installations-point',
        type: 'circle',
        source: 'installations',
        minzoom: 8,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            14, 12,
          ],
          'circle-color': [
            'case',
            ['get', 'hasSolar'],
            '#22c55e',
            '#f59e0b',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8,
        },
      });

      // Popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.current.on('mouseenter', 'installations-point', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        const feature = e.features[0];
        const coords = (feature.geometry as any).coordinates.slice();
        const props = feature.properties;

        popup
          .setLngLat(coords)
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <strong style="color: #f59e0b;">${props?.region || 'Unknown'}</strong><br/>
              <span style="font-size: 12px;">
                Status: <span style="color: ${props?.hasSolar ? '#22c55e' : '#ef4444'}">${props?.hasSolar ? 'Solar Detected' : 'No Solar'}</span><br/>
                Capacity: ${props?.capacity?.toFixed(1) || 0} kW<br/>
                Confidence: ${((props?.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on('mouseleave', 'installations-point', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [hasToken]);

  // Update source when applications change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource('installations') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geoJsonData);
    }

    // Calculate stats
    const validApps = applications.filter(a => a.latitude && a.longitude);
    const totalCapacity = validApps.reduce((sum, a) => sum + (a.aiResult?.capacity_kw_est || 0), 0);
    setStats({
      installations: validApps.length,
      avgCapacity: validApps.length > 0 ? totalCapacity / validApps.length : 0,
    });
  }, [applications, mapLoaded]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    
    setIsValidating(true);
    const isValid = await validateMapboxToken(tokenInput.trim());
    
    if (isValid) {
      setMapboxToken(tokenInput.trim());
      setHasToken(true);
      setShowSettings(false);
      setTokenInput('');
    }
    setIsValidating(false);
  };

  if (!hasToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Installation Density Heatmap
          </CardTitle>
          <CardDescription>Configure Mapbox to view the heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-lg border-2 border-dashed">
            <Map className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center max-w-sm">
              Mapbox token required to display the installation density heatmap
            </p>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configure Mapbox
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mapbox Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Get your public token from{' '}
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Mapbox Dashboard
                    </a>
                  </p>
                  <Input
                    placeholder="pk.eyJ1..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveToken} disabled={isValidating || !tokenInput.trim()}>
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      'Save Token'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Installation Density Heatmap
            </CardTitle>
            <CardDescription>Geographic distribution of solar installations across India</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {stats.installations} locations
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {stats.avgCapacity.toFixed(1)} kW avg
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <p className="text-xs font-medium mb-2">Density</p>
            <div className="flex items-center gap-1">
              <div className="h-3 w-16 rounded" style={{
                background: 'linear-gradient(to right, rgb(33, 102, 172), rgb(103, 169, 207), rgb(209, 229, 240), rgb(253, 219, 199), rgb(239, 138, 98), rgb(178, 24, 43))'
              }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Point legend */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <p className="text-xs font-medium mb-2">Status (zoom in)</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-[10px]">Solar Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-[10px]">No Solar</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionHeatmap;
