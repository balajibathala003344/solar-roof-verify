import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBeGp0fv5BEWSrmXs06DKr0ngecK8i4gAU",
  authDomain: "toproof-59f37.firebaseapp.com",
  databaseURL: "https://toproof-59f37-default-rtdb.firebaseio.com",
  projectId: "toproof-59f37",
  storageBucket: "toproof-59f37.firebasestorage.app",
  messagingSenderId: "1091522288480",
  appId: "1:1091522288480:web:8e3b430bf84ec5d5cc9c05",
  measurementId: "G-9WN166GQ9C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Only initialize analytics in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
