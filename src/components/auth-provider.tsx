"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import { IProfile, UserRole } from "@/types";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: IProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// --- DATOS DE PRUEBA PARA DESARROLLO ---
const DEV_MOCK_USER: User = {
  id: "dev-user-id-123",
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: "Usuario de Prueba (Dev)" },
  aud: "authenticated",
  email: "dev@example.com",
  created_at: new Date().toISOString(),
  // ... otros campos de User si los necesitas, pero estos suelen ser suficientes
};

const DEV_MOCK_SESSION: Session = {
  access_token: "dev-mock-access-token",
  refresh_token: "dev-mock-refresh-token",
  user: DEV_MOCK_USER,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

const DEV_MOCK_PROFILE: IProfile = {
  id: "dev-user-id-123",
  nombre_completo: "Usuario de Prueba (Dev)",
  avatar_url: null,
  rol: UserRole.USER,
  email: "dev@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// --- FIN DE DATOS DE PRUEBA ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<IProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async (userId: string) => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
      setProfile(DEV_MOCK_PROFILE);
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<IProfile>();

      if (error && status !== 406) {
        console.error("AuthProvider: Error fetching profile (modo real):", { message: error.message, status });
        setProfile(null);
      } else if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e: unknown) {
        console.error("AuthProvider: Excepción en fetchProfile (modo real):", e instanceof Error ? e.message : e);
        setProfile(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
      setSession(DEV_MOCK_SESSION);
      setUser(DEV_MOCK_USER);
      fetchProfile(DEV_MOCK_USER.id);
      return;
    }

    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      console.error('AuthProvider: Error en getSession() (modo real):', error);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setIsLoading(true); 
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null); 
          setIsLoading(false);
        }
      }
    );

    return () => {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') return;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);
  
  const signOut = async () => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
      console.warn('AuthProvider: signOut llamado en MODO DESARROLLO SIMULADO. Limpiando estado local.');
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('AuthProvider: Error en signOut (modo real):', error.message);
    }
  };

  const value = React.useMemo(() => ({
    session,
    user,
    profile,
    isLoading,
    signOut,
  }), [session, user, profile, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 