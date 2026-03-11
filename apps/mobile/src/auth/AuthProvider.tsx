import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiClient } from '@/lib/api';
import { AuthUser } from '@/types/api';
import {
  UI_TEST_FAKE_AUTH,
  UI_TEST_RESET_SESSION,
} from '@/lib/launchArgs';

type Session = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  session: Session | null;
  isBootstrapping: boolean;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  isLoggingInWithPassword: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Hardcoded fake session returned when UI_TEST_FAKE_AUTH is active.
// This keeps tests self-contained: no real API or real credentials needed.
const FAKE_SESSION: Session = {
  token: 'ui-test-fake-token',
  user: {
    id: 'ui-test-user-id',
    phone: '+18625918688',
    displayName: 'Test Operator',
    primaryRole: 'operator',
    email: 'operator@example.com',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoggingInWithPassword, setIsLoggingInWithPassword] = useState(false);

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
        // UI-test reset: wipe any persisted session so the app always starts
        // logged out when the test passes -UI_TEST_RESET_SESSION YES.
        if (UI_TEST_RESET_SESSION === 'YES') {
          await apiClient.clearSession();
          setSession(null);
          return;
        }

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
      // UI-test fake auth: skip the real API call and inject a synthetic session.
      if (UI_TEST_FAKE_AUTH === 'YES') {
        await apiClient.setToken(FAKE_SESSION.token);
        await apiClient.setStoredUser(FAKE_SESSION.user);
        setSession(FAKE_SESSION);
        return;
      }

      const authResult = await api.auth.verifyOtp(phone, code);
      await apiClient.setToken(authResult.token);
      await apiClient.setStoredUser(authResult.user);
      setSession(authResult);
    } finally {
      setIsVerifyingOtp(false);
    }
  }, []);

  const loginWithPassword = useCallback(async (username: string, password: string) => {
    setIsLoggingInWithPassword(true);
    try {
      // UI-test fake auth: skip the real API call and inject a synthetic session.
      if (UI_TEST_FAKE_AUTH === 'YES') {
        await apiClient.setToken(FAKE_SESSION.token);
        await apiClient.setStoredUser(FAKE_SESSION.user);
        setSession(FAKE_SESSION);
        return;
      }

      const authResult = await api.auth.loginWithPassword(username, password);
      await apiClient.setToken(authResult.token);
      await apiClient.setStoredUser(authResult.user);
      setSession(authResult);
    } finally {
      setIsLoggingInWithPassword(false);
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
      isLoggingInWithPassword,
      sendOtp,
      verifyOtp,
      loginWithPassword,
      logout,
      refreshProfile,
    }),
    [
      session,
      isBootstrapping,
      isSendingOtp,
      isVerifyingOtp,
      isLoggingInWithPassword,
      sendOtp,
      verifyOtp,
      loginWithPassword,
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
