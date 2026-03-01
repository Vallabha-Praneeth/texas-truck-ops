import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiClient } from '@/lib/api';
import { AuthUser } from '@/types/api';

type Session = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  session: Session | null;
  isBootstrapping: boolean;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    const profile = await api.auth.getProfile();
    const refreshedSession: Session = {
      token: session.token,
      user: {
        id: profile.id,
        phone: profile.phone,
        displayName: profile.displayName,
        primaryRole: profile.primaryRole,
        email: profile.email,
      },
    };

    await apiClient.setStoredUser(refreshedSession.user);
    setSession(refreshedSession);
  }, [session]);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      setSession(null);
    });

    return () => {
      apiClient.setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await apiClient.getToken();
        if (!token) {
          setSession(null);
          return;
        }

        const profile = await api.auth.getProfile();
        const nextUser: AuthUser = {
          id: profile.id,
          phone: profile.phone,
          displayName: profile.displayName,
          primaryRole: profile.primaryRole,
          email: profile.email,
        };

        await apiClient.setStoredUser(nextUser);
        setSession({ token, user: nextUser });
      } catch {
        await apiClient.clearSession();
        setSession(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    setIsSendingOtp(true);
    try {
      await api.auth.login(phone);
    } finally {
      setIsSendingOtp(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    setIsVerifyingOtp(true);
    try {
      const authResult = await api.auth.verifyOtp(phone, code);
      await apiClient.setToken(authResult.token);
      await apiClient.setStoredUser(authResult.user);
      setSession(authResult);
    } finally {
      setIsVerifyingOtp(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isBootstrapping,
      isSendingOtp,
      isVerifyingOtp,
      sendOtp,
      verifyOtp,
      logout,
      refreshProfile,
    }),
    [
      session,
      isBootstrapping,
      isSendingOtp,
      isVerifyingOtp,
      sendOtp,
      verifyOtp,
      logout,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
