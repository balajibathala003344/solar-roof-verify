// Mapbox Static Images API for satellite imagery
// Uses Mapbox's satellite-streets-v12 style for high-resolution rooftop images

const MAPBOX_TOKEN_KEY = 'mapbox_public_token';

// Get token from localStorage
export const getMapboxToken = (): string | null => {
  return localStorage.getItem(MAPBOX_TOKEN_KEY);
};

// Save token to localStorage
export const setMapboxToken = (token: string): void => {
  localStorage.setItem(MAPBOX_TOKEN_KEY, token);
};

// Check if token exists
export const hasMapboxToken = (): boolean => {
  const token = getMapboxToken();
  return !!token && token.length > 0;
};

// Remove token
export const removeMapboxToken = (): void => {
  localStorage.removeItem(MAPBOX_TOKEN_KEY);
};

export interface SatelliteImageOptions {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: number;
  height?: number;
  bearing?: number;
  pitch?: number;
}

/**
 * Generate a Mapbox Static Image URL for satellite imagery
 */
export const getSatelliteImageUrl = (options: SatelliteImageOptions): string | null => {
  const token = getMapboxToken();
  if (!token) return null;

  const {
    latitude,
    longitude,
    zoom = 18, // High zoom for rooftop detail
    width = 640,
    height = 640,
    bearing = 0,
    pitch = 0,
  } = options;

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.error('Invalid coordinates');
    return null;
  }

  // Use satellite-streets style for best rooftop visibility
  const style = 'mapbox/satellite-streets-v12';
  
  // Mapbox Static Images API URL
  const url = `https://api.mapbox.com/styles/v1/${style}/static/${longitude},${latitude},${zoom},${bearing},${pitch}/${width}x${height}@2x?access_token=${token}`;
  
  return url;
};

/**
 * Fetch satellite image as a Blob
 */
export const fetchSatelliteImage = async (options: SatelliteImageOptions): Promise<Blob | null> => {
  const url = getSatelliteImageUrl(options);
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch satellite image:', response.status);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching satellite image:', error);
    return null;
  }
};

/**
 * Fetch satellite image as a base64 data URL
 */
export const fetchSatelliteImageAsBase64 = async (options: SatelliteImageOptions): Promise<string | null> => {
  const blob = await fetchSatelliteImage(options);
  if (!blob) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
};

/**
 * Validate Mapbox token by making a test request
 */
export const validateMapboxToken = async (token: string): Promise<boolean> => {
  try {
    const testUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=${token}`;
    const response = await fetch(testUrl);
    return response.ok;
  } catch {
    return false;
  }
};
