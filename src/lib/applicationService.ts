import { ref, push, set, get, update, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from './firebase';
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
  address?: string;
  region: string;
  imageUrl?: string;
  status: ApplicationStatus;
  aiResult?: DetectionResult;
  officerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  let imageUrl: string | undefined;

  // Upload image if provided
  if (data.imageFile) {
    const imageRef = storageRef(storage, `applications/${userId}/${Date.now()}_${data.imageFile.name}`);
    await uploadBytes(imageRef, data.imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  const applicationsRef = ref(database, 'applications');
  const newAppRef = push(applicationsRef);
  
  const application: Omit<Application, 'id'> = {
    userId,
    userName,
    userEmail,
    sampleId: data.sampleId,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
    region: data.region,
    imageUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

  // Update with AI results
  await update(appRef, {
    status: 'ai_completed',
    aiResult: result,
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
  
  const listener = onValue(userAppsQuery, (snapshot) => {
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
  
  const listener = onValue(appsRef, (snapshot) => {
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
