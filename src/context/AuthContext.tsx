import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import type { UserRole } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  signUpWithEmail: (email: string, password: string, role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<UserRole | null>;
  logout: () => Promise<void>;
  assignRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// For SCR demo we keep roles in memory + localStorage instead of real Firestore.
const ROLE_STORAGE_KEY = "eventsphere_role_by_uid";

type RoleStore = Record<string, UserRole>;

function loadRoleStore(): RoleStore {
  try {
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoleStore) : {};
  } catch {
    return {};
  }
}

function saveRoleStore(store: RoleStore) {
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore – non-critical for demo
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const store = loadRoleStore();
        setRole(store[firebaseUser.uid] ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const persistRole = (uid: string, newRole: UserRole) => {
    const store = loadRoleStore();
    store[uid] = newRole;
    saveRoleStore(store);
    setRole(newRole);
  };

  const signUpWithEmail = async (email: string, password: string, selectedRole: UserRole) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    persistRole(cred.user.uid, selectedRole);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (selectedRole?: UserRole): Promise<UserRole | null> => {
    const cred = await signInWithPopup(auth, googleProvider);
    const store = loadRoleStore();
    const existingRole = store[cred.user.uid];

    if (existingRole) {
      setRole(existingRole);
      return existingRole;
    }

    if (selectedRole) {
      persistRole(cred.user.uid, selectedRole);
      return selectedRole;
    }

    return null;
  };

  const assignRole = async (newRole: UserRole) => {
    if (user) {
      persistRole(user.uid, newRole);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextValue = {
    user,
    loading,
    role,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
    assignRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};



