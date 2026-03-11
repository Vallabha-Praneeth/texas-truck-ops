import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/auth';
import { theme } from '@/lib/theme';
import {
  UI_TEST_BYPASS_SEND_OTP,
  UI_TEST_FAKE_AUTH,
  UI_TEST_OTP_CODE,
  UI_TEST_PHONE_DIGITS,
  UI_TEST_USERNAME,
  UI_TEST_PASSWORD,
} from '@/lib/launchArgs';

const PHONE_REGEX = /^\+1\d{10}$/;

const normalizeUsPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('1') ? digits.slice(1) : digits;
  return `+1${nationalNumber.slice(0, 10)}`;
};

type AuthMode = 'otp' | 'password';

export const AuthScreen = () => {
  const {
    sendOtp,
    verifyOtp,
    loginWithPassword,
    isSendingOtp,
    isVerifyingOtp,
    isLoggingInWithPassword,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('otp');
  const [phone, setPhone] = useState(() =>
    UI_TEST_PHONE_DIGITS ? `+1${UI_TEST_PHONE_DIGITS}` : '+1'
  );
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill password mode from launch args.
  const [username, setUsername] = useState(UI_TEST_USERNAME ?? '');
  const [password, setPassword] = useState(UI_TEST_PASSWORD ?? '');

  // When UI_TEST_PHONE_DIGITS arrives after initial render (React Native can
  // evaluate NativeModules constants slightly after module load on some builds),
  // make sure the field is updated exactly once.
  useEffect(() => {
    if (UI_TEST_PHONE_DIGITS && phone === '+1') {
      setPhone(`+1${UI_TEST_PHONE_DIGITS}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the OTP entry screen appears in a UI test, pre-fill the verification
  // code from the UI_TEST_OTP_CODE launch arg so the loginWithOtp test helper
  // does not have to type digits via typeDigitsReliably.
  useEffect(() => {
    if (showCodeInput && UI_TEST_OTP_CODE) {
      setCode(UI_TEST_OTP_CODE.replace(/\D/g, '').slice(0, 6));
    }
  }, [showCodeInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendOtp = async () => {
    setError(null);

    if (!PHONE_REGEX.test(phone)) {
      setError('Use +1 followed by 10 digits (example: +15551234567).');
      return;
    }

    // UI-test bypass: skip the network call and go straight to code entry.
    if (UI_TEST_BYPASS_SEND_OTP === 'YES') {
      setShowCodeInput(true);
      return;
    }

    try {
      await sendOtp(phone);
      setShowCodeInput(true);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Failed to send OTP.';
      setError(message);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);

    if (code.length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    try {
      await verifyOtp(phone, code);
    } catch (verifyError) {
      const message =
        verifyError instanceof Error ? verifyError.message : 'OTP verification failed.';
      setError(message);
    }
  };

  const handlePasswordLogin = async () => {
    setError(null);

    // In fake-auth mode the provider will inject a hardcoded session regardless
    // of what credentials are supplied, so skip client-side validation to
    // guarantee the call always reaches the provider even when pre-filled
    // launch-arg state hasn't resolved yet.
    if (UI_TEST_FAKE_AUTH !== 'YES') {
      if (!username.trim()) {
        setError('Email is required.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
    }

    try {
      await loginWithPassword(username.trim(), password);
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : 'Login failed.';
      setError(message);
    }
  };

  const handleUseDifferentNumber = () => {
    setShowCodeInput(false);
    setCode('');
    setError(null);
  };

  const switchToOtp = () => {
    setMode('otp');
    setShowCodeInput(false);
    setError(null);
  };

  const switchToPassword = () => {
    setMode('password');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>LED Billboard Marketplace</Text>
            <Text style={styles.subtitle}>
              {mode === 'password'
                ? 'Sign in with your email and password.'
                : showCodeInput
                  ? 'Enter the 6-digit code sent to your phone.'
                  : 'Sign in using your phone number.'}
            </Text>
          </View>

          {/* Mode toggle buttons */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              testID="toggle-otp"
              accessibilityLabel="toggle-otp"
              style={[
                styles.modeToggleButton,
                mode === 'otp' && styles.modeToggleButtonActive,
              ]}
              onPress={switchToOtp}
              disabled={mode === 'otp'}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'otp' && styles.modeToggleTextActive,
                ]}
              >
                Phone OTP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="toggle-password"
              accessibilityLabel="toggle-password"
              style={[
                styles.modeToggleButton,
                mode === 'password' && styles.modeToggleButtonActive,
              ]}
              onPress={switchToPassword}
              disabled={mode === 'password'}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'password' && styles.modeToggleTextActive,
                ]}
              >
                Password
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'otp' ? (
            !showCodeInput ? (
              <View style={styles.formCard}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  testID="phone-input"
                  accessibilityLabel="phone-input"
                  style={styles.input}
                  value={phone}
                  onChangeText={(value) => setPhone(normalizeUsPhoneInput(value))}
                  placeholder="+15551234567"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!isSendingOtp}
                />

                {error ? (
                  <Text testID="error-message" style={styles.errorText}>
                    {error}
                  </Text>
                ) : null}

                <TouchableOpacity
                  testID="send-otp-button"
                  accessibilityLabel="send-otp-button"
                  style={styles.primaryButton}
                  onPress={() => void handleSendOtp()}
                  disabled={isSendingOtp}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSendingOtp ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  testID="otp-input"
                  accessibilityLabel="otp-input"
                  style={[styles.input, styles.otpInput]}
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  keyboardType="number-pad"
                  editable={!isVerifyingOtp}
                  maxLength={6}
                />

                {error ? (
                  <Text testID="error-message" style={styles.errorText}>
                    {error}
                  </Text>
                ) : null}

                <TouchableOpacity
                  testID="verify-button"
                  accessibilityLabel="verify-button"
                  style={styles.primaryButton}
                  onPress={() => void handleVerifyOtp()}
                  disabled={isVerifyingOtp}
                >
                  <Text style={styles.primaryButtonText}>
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="use-different-number-button"
                  accessibilityLabel="use-different-number-button"
                  style={styles.secondaryButton}
                  onPress={handleUseDifferentNumber}
                  disabled={isVerifyingOtp}
                >
                  <Text style={styles.secondaryButtonText}>Use Different Number</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            /* Password mode */
            <View style={styles.formCard}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="username-input"
                accessibilityLabel="username-input"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="operator@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoggingInWithPassword}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                testID="password-input"
                accessibilityLabel="password-input"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                editable={!isLoggingInWithPassword}
              />

              {error ? (
                <Text testID="error-message" style={styles.errorText}>
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                testID="password-login-button"
                accessibilityLabel="password-login-button"
                style={styles.primaryButton}
                onPress={() => void handlePasswordLogin()}
                disabled={isLoggingInWithPassword}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoggingInWithPassword ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.helperText}>
            In development, OTP is logged by the API server console.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 22,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modeToggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  modeToggleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  modeToggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  modeToggleTextActive: {
    color: theme.colors.primaryForeground,
  },
  formCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    fontSize: theme.fontSize.base,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 6,
  },
  primaryButton: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.sm,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
  },
  helperText: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
});
