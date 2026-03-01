import React, { useState } from 'react';
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

const PHONE_REGEX = /^\+1\d{10}$/;

const normalizeUsPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('1') ? digits.slice(1) : digits;
  return `+1${nationalNumber.slice(0, 10)}`;
};

export const AuthScreen = () => {
  const { sendOtp, verifyOtp, isSendingOtp, isVerifyingOtp } = useAuth();

  const [phone, setPhone] = useState('+1');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setError(null);

    if (!PHONE_REGEX.test(phone)) {
      setError('Use +1 followed by 10 digits (example: +15551234567).');
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

  const handleUseDifferentNumber = () => {
    setShowCodeInput(false);
    setCode('');
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
              {showCodeInput
                ? 'Enter the 6-digit code sent to your phone.'
                : 'Sign in using your phone number.'}
            </Text>
          </View>

          {!showCodeInput ? (
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
