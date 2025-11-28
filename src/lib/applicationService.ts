import { ref, push, set, get, update, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebase';
import { runSolarDetection, DetectionResult } from './aiDetection';

export type ApplicationStatus = 'pending' | 'processing' | 'ai_completed' | 'approved' | 'rejected';

export interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sampleId: string;
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  imageUrl: string;
  status: ApplicationStatus;
  aiResult?: DetectionResult;
  officerNotes: string;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Convert File to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const createApplication = async (
  userId: string,
  userName: string,
  userEmail: string,
  data: {
    sampleId: string;
    latitude: number;
    longitude: number;
    address?: string;
    region: string;
    imageFile?: File;
  }
): Promise<string> => {
  let imageUrl = '';

  // Convert image to base64 if provided
  if (data.imageFile) {
    try {
      imageUrl = await fileToBase64(data.imageFile);
    } catch (error) {
      console.warn('Image conversion failed:', error);
    }
  }

  const applicationsRef = ref(database, 'applications');
  const newAppRef = push(applicationsRef);
  
  const now = new Date().toISOString();
  
  // Create application object with NO undefined values
  const application = {
    userId,
    userName,
    userEmail,
    sampleId: data.sampleId,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address || '',
    region: data.region,
    imageUrl,
    status: 'pending' as ApplicationStatus,
    officerNotes: '',
    reviewedBy: '',
    reviewedAt: '',
    createdAt: now,
    updatedAt: now
  };

  await set(newAppRef, application);
  return newAppRef.key!;
};

export const processApplication = async (applicationId: string): Promise<void> => {
  const appRef = ref(database, `applications/${applicationId}`);
  const snapshot = await get(appRef);
  
  if (!snapshot.exists()) {
    throw new Error('Application not found');
  }

  const app = snapshot.val() as Application;
  
  // Update status to processing
  await update(appRef, { 
    status: 'processing',
    updatedAt: new Date().toISOString()
  });

  // Run AI detection
  const result = await runSolarDetection(
    app.sampleId,
    app.latitude,
    app.longitude
  );

  // Ensure AI result has no undefined values
  const cleanAiResult = {
    sample_id: result.sample_id,
    lat: result.lat,
    lon: result.lon,
    has_solar: result.has_solar,
    confidence: result.confidence,
    panel_count_est: result.panel_count_est,
    pv_area_sqm_est: result.pv_area_sqm_est,
    capacity_kw_est: result.capacity_kw_est,
    qc_status: result.qc_status,
    qc_notes: result.qc_notes || [],
    bbox_or_mask: result.bbox_or_mask || '',
    image_metadata: {
      source: result.image_metadata?.source || 'Unknown',
      capture_date: result.image_metadata?.capture_date || new Date().toISOString().split('T')[0]
    },
    processing_time_ms: result.processing_time_ms
  };

  // Update with AI results
  await update(appRef, {
    status: 'ai_completed',
    aiResult: cleanAiResult,
    updatedAt: new Date().toISOString()
  });
};

export const reviewApplication = async (
  applicationId: string,
  status: 'approved' | 'rejected',
  officerId: string,
  notes?: string
): Promise<void> => {
  const appRef = ref(database, `applications/${applicationId}`);
  
  await update(appRef, {
    status,
    officerNotes: notes || '',
    reviewedBy: officerId,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const getUserApplications = (
  userId: string,
  callback: (apps: Application[]) => void
): () => void => {
  const appsRef = ref(database, 'applications');
  const userAppsQuery = query(appsRef, orderByChild('userId'), equalTo(userId));
  
  onValue(userAppsQuery, (snapshot) => {
    const apps: Application[] = [];
    snapshot.forEach((child) => {
      apps.push({ id: child.key!, ...child.val() });
    });
    // Sort by createdAt descending
    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(apps);
  });

  return () => off(userAppsQuery);
};

export const getAllApplications = (
  callback: (apps: Application[]) => void
): () => void => {
  const appsRef = ref(database, 'applications');
  
  onValue(appsRef, (snapshot) => {
    const apps: Application[] = [];
    snapshot.forEach((child) => {
      apps.push({ id: child.key!, ...child.val() });
    });
    // Sort by createdAt descending
    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(apps);
  });

  return () => off(appsRef);
};

export const getApplication = async (applicationId: string): Promise<Application | null> => {
  const appRef = ref(database, `applications/${applicationId}`);
  const snapshot = await get(appRef);
  
  if (snapshot.exists()) {
    return { id: applicationId, ...snapshot.val() };
  }
  return null;
};
