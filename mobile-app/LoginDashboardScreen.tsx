import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Phone } from 'lucide-react-native';
import { API_BASE_URL } from './src/config/env';

const API_DEFAULT_BASE_URL = API_BASE_URL;

type LoginDashboardScreenProps = {
  apiBaseUrl?: string;
};

type DashboardData = unknown;

const formatStatus = (status: string) => {
  if (!status) return 'UNKNOWN';
  return status.replace('_', ' ').toUpperCase();
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { backgroundColor: '#00e5ff1a', borderColor: '#00e5ff66' };
    case 'running':
      return { backgroundColor: '#4caf501a', borderColor: '#4caf5066' };
    case 'completed':
      return { backgroundColor: '#ffffff1a', borderColor: '#ffffff66' };
    case 'pending_deposit':
    case 'awaiting_review':
      return { backgroundColor: '#ff98001a', borderColor: '#ff980066' };
    case 'cancelled':
    case 'disputed':
      return { backgroundColor: '#f443361a', borderColor: '#f4433666' };
    default:
      return { backgroundColor: '#9e9e9e1a', borderColor: '#9e9e9e66' };
  }
};

const getStatusTextStyle = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { color: '#00e5ff' };
    case 'running':
      return { color: '#4caf50' };
    case 'completed':
      return { color: '#ffffff' };
    case 'pending_deposit':
    case 'awaiting_review':
      return { color: '#ff9800' };
    case 'cancelled':
    case 'disputed':
      return { color: '#f44336' };
    default:
      return { color: '#9e9e9e' };
  }
};

export const LoginDashboardScreen: React.FC<LoginDashboardScreenProps> = ({
  apiBaseUrl = API_DEFAULT_BASE_URL,
}) => {
  const meshAnim = useRef(new Animated.Value(0)).current;
  const successPulse = useRef(new Animated.Value(0)).current;

  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAwaitingOtp, setIsAwaitingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  // Real data state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(meshAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [meshAnim]);

  useEffect(() => {
    if (!showSuccess) {
      successPulse.stopAnimation();
      successPulse.setValue(0);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(successPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(successPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [showSuccess, successPulse]);

  const handleLogin = useCallback(async () => {
    if (!phone.trim()) {
      setError('Please enter a phone number.');
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    setShowSuccess(false);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      setIsAwaitingOtp(true);
      setShowSuccess(true);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Unexpected error while logging in.';
      setError(message);
    } finally {
      setIsLoggingIn(false);
    }
  }, [apiBaseUrl, phone]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode.trim()) {
      setError('Please enter the OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);
    setShowSuccess(false);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otpCode }),
      });

      if (!response.ok) {
        throw new Error(`OTP verification failed with status ${response.status}`);
      }

      const json = await response.json();

      const maybeToken =
        (json && (json.token as string | undefined)) ??
        (json && (json.accessToken as string | undefined));

      if (maybeToken) {
        setToken(maybeToken);
        setShowSuccess(true);
      } else {
        throw new Error('No token received');
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Unexpected error during OTP verification.';
      setError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [apiBaseUrl, phone, otpCode]);


  const handleLoadDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    setError(null);
    setShowSuccess(false);

    try {
      // 1. Load User Profile
      const userResponse = await fetch(`${apiBaseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!userResponse.ok) {
        throw new Error(`User profile request failed with status ${userResponse.status}`);
      }

      const userJson = await userResponse.json();
      setUserProfile(userJson);

      // 2. Load Bookings
      const bookingsResponse = await fetch(`${apiBaseUrl}/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!bookingsResponse.ok) {
        throw new Error(`Bookings request failed with status ${bookingsResponse.status}`);
      }

      const bookingsJson = await bookingsResponse.json();
      setBookings(Array.isArray(bookingsJson) ? bookingsJson : []);

      setShowSuccess(true);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unexpected error while loading dashboard.';
      setError(message);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [apiBaseUrl, token]);

  const isBusy = isLoggingIn || isVerifyingOtp || isLoadingDashboard;

  const meshTranslateA = {
    transform: [
      {
        translateX: meshAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 40],
        }),
      },
      {
        translateY: meshAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -30],
        }),
      },
    ],
  };

  const meshTranslateB = {
    transform: [
      {
        translateX: meshAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -35],
        }),
      },
      {
        translateY: meshAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 25],
        }),
      },
    ],
  };

  const successScale = successPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const successGlowOpacity = successPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const successCardAnimatedStyle = {
    transform: [{ scale: successScale }],
    shadowOpacity: successGlowOpacity,
  };

  const titleFontFamily =
    Platform.OS === 'ios' ? 'System' : Platform.OS === 'android' ? 'Roboto' : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.meshContainer} pointerEvents="none">
        <Animated.View
          style={[styles.meshBlob, styles.meshBlobPrimary, meshTranslateA]}
        />
        <Animated.View
          style={[styles.meshBlob, styles.meshBlobSecondary, meshTranslateB]}
        />
        <View style={styles.meshOverlay} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={[styles.title, titleFontFamily && { fontFamily: titleFontFamily }]}>
            LED Marketplace
          </Text>
          <Text
            style={[
              styles.subtitle,
              titleFontFamily && { fontFamily: titleFontFamily },
            ]}
          >
            Secure Login & Dashboard
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login / Auth</Text>

            {!token && (
              <>
                <View style={styles.iconLabelRow}>
                  <View style={styles.iconCircle}>
                    <Phone size={18} color="#00e5ff" />
                  </View>
                </View>

                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 234 567 8901"
                  placeholderTextColor="#777"
                  keyboardType="phone-pad"
                  style={styles.input}
                  editable={!isBusy && !isAwaitingOtp}
                />
              </>
            )}

            {!isAwaitingOtp && !token && (
              <ScaleButton
                style={[styles.button, isBusy && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isBusy}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#121212" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </ScaleButton>
            )}

            {isAwaitingOtp && !token && (
              <>
                <TextInput
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="OTP Code"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  style={styles.input}
                  editable={!isBusy}
                />

                <ScaleButton
                  style={[styles.button, isBusy && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isBusy}
                >
                  {isVerifyingOtp ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </ScaleButton>
              </>
            )}

            <ScaleButton
              style={[
                styles.secondaryButton,
                (!token || isBusy) && styles.buttonDisabled,
                { marginTop: token ? 0 : 16 },
              ]}
              onPress={handleLoadDashboard}
              disabled={!token || isBusy}
            >
              {isLoadingDashboard ? (
                <ActivityIndicator color="#00e5ff" />
              ) : (
                <Text style={styles.secondaryButtonText}>Load Dashboard Data</Text>
              )}
            </ScaleButton>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Animated.View style={[styles.card, styles.successCard, successCardAnimatedStyle]}>
            <Text style={styles.cardTitle}>Status</Text>
            {showSuccess ? (
              <View style={styles.successContainer}>
                <LottieView
                  source={require('./assets/animations/success.json')}
                  autoPlay
                  loop={false}
                  style={styles.lottie}
                />
                <Text style={styles.successText}>Success!</Text>
              </View>
            ) : (
              <Text style={styles.mutedText}>
                Complete a login or dashboard request to see the success animation.
              </Text>
            )}
          </Animated.View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Bookings</Text>

            {userProfile && (
              <Text style={[styles.mutedText, { marginBottom: 12 }]}>
                Logged in as: {userProfile.firstName} {userProfile.lastName} ({userProfile.primaryRole})
              </Text>
            )}

            {bookings && bookings.length > 0 ? (
              <View style={styles.dashboardContainer}>
                {bookings.map((booking: any) => (
                  <View key={booking.id} style={styles.bookingRow}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>Booking #{booking.id?.substring(0, 8)}</Text>
                      {booking.offerId && (
                        <Text style={styles.bookingSubtitle}>Offer ID: {booking.offerId}</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, getStatusStyle(booking.status)]}>
                      <Text style={[styles.statusText, getStatusTextStyle(booking.status)]}>
                        {formatStatus(booking.status)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>
                {token ? 'No active bookings found or not loaded.' : 'Please login to view bookings.'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  meshContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  meshBlob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    opacity: 0.65,
  },
  meshBlobPrimary: {
    backgroundColor: '#0F172A',
    top: -40,
    left: -60,
  },
  meshBlobSecondary: {
    backgroundColor: '#00e5ff33',
    bottom: -60,
    right: -40,
  },
  meshOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212dd',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9e9e9e',
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff10',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#00e5ff33',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  successCard: {
    shadowColor: '#00e5ff',
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0b0b0bcc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00e5ff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00e5ff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    color: '#ff5252',
    fontSize: 12,
  },
  mutedText: {
    color: '#9e9e9e',
    fontSize: 12,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    marginTop: 8,
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: '600',
  },
  lottie: {
    width: 120,
    height: 120,
  },
  dashboardContainer: {
    marginTop: 4,
    maxHeight: 260,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00e5ff66',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1120aa',
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff1a',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

type ScaleButtonProps = React.ComponentProps<typeof TouchableOpacity> & {
  children: React.ReactNode;
};

const ScaleButton: React.FC<ScaleButtonProps> = ({
  children,
  style,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default LoginDashboardScreen;
