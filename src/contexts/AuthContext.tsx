import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase';

export type UserRole = 'user' | 'officer';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  region?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, region?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user profile from database
        const profileRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(profileRef);
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
        } else {
          // Create a default profile if one doesn't exist
          const defaultProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'user',
            region: '',
            createdAt: new Date().toISOString()
          };
          await set(profileRef, defaultProfile);
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole, region?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in database
    const profile: UserProfile = {
      uid: result.user.uid,
      email,
      name,
      role,
      region: region || '',
      createdAt: new Date().toISOString()
    };
    
    await set(ref(database, `users/${result.user.uid}`), profile);
    setUserProfile(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
