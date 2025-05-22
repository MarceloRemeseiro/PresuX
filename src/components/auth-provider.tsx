"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null; // Podríamos tipar esto más adelante con IProfile
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

const DEV_MOCK_PROFILE = {
  id: "dev-user-id-123",
  nombre_completo: "Usuario de Prueba (Dev)",
  avatar_url: null, // o una URL de imagen de placeholder
  rol: "user", // o 'admin' si quieres probar funcionalidades de admin
  // ... otros campos de tu tabla profiles
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// --- FIN DE DATOS DE PRUEBA ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Quitamos los logs de renderizado para no saturar con el modo dev
  // console.log('AuthProvider: Renderizado. isLoading:', isLoading, 'User:', user?.id, 'Profile:', profile);

  React.useEffect(() => {
    // Condición para simular usuario en desarrollo
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
      console.warn('AuthProvider: MODO DESARROLLO - SIMULANDO USUARIO AUTENTICADO. Las llamadas reales a Supabase Auth están desactivadas en AuthProvider.');
      setSession(DEV_MOCK_SESSION);
      setUser(DEV_MOCK_USER);
      setProfile(DEV_MOCK_PROFILE);
      setIsLoading(false);
      return; // No ejecutar la lógica real de Supabase
    }

    // Lógica original de Supabase si no estamos simulando
    console.log('AuthProvider: useEffect disparado (modo real).');
    setIsLoading(true);
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('AuthProvider: getSession() completado (modo real).', { session: currentSession ? { user_id: currentSession.user.id } : null });
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      console.error('AuthProvider: Error en getSession() (modo real):', error);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // No ejecutar si estamos en modo simulación (aunque el return anterior debería prevenirlo)
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') return;

        console.log('AuthProvider: onAuthStateChange - Evento (modo real):', event);
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
      
      console.log('AuthProvider: useEffect cleanup (modo real) - Desuscribiendo.');
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // useEffect se ejecuta solo una vez

  const fetchProfile = async (userId: string) => {
    // No llamar si estamos en modo simulación
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
        console.warn('AuthProvider: fetchProfile omitido en modo desarrollo simulado.');
        // Asegurarse de que isLoading se maneje si se llegó aquí por error
        if (isLoading) setIsLoading(false); 
        return;
    }
    
    console.log(`AuthProvider: fetchProfile llamado para userId (modo real): ${userId}`);
    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && status !== 406) {
        console.error("AuthProvider: Error fetching profile (modo real):", { message: error.message, status });
        setProfile(null);
      } else if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e: any) {
        console.error("AuthProvider: Excepción en fetchProfile (modo real):", e.message);
        setProfile(null);
    } finally {
        setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_AUTH_FOR_DEV === 'true') {
      console.warn('AuthProvider: signOut llamado en MODO DESARROLLO SIMULADO. Limpiando estado local.');
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false); // Para que la UI reaccione como si se hubiera deslogueado
      return;
    }

    console.log('AuthProvider: signOut llamado (modo real).');
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('AuthProvider: Error en signOut (modo real):', error.message);
    }
    // onAuthStateChange se encargará del resto
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