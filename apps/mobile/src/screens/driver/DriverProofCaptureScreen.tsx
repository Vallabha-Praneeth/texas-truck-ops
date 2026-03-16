import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useBookings, useUploadProof } from '@/hooks';
import { theme } from '@/lib/theme';

export const DriverProofCaptureScreen = () => {
  const {
    data: bookings,
    isLoading,
    refetch,
  } = useBookings({ refetchInterval: 8000 });

  const uploadProof = useUploadProof();

  const [selectedBookingId, setSelectedBookingId] = React.useState('');
  const [proofNote, setProofNote] = React.useState('');
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [capturedAt, setCapturedAt] = React.useState<Date | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = React.useState<boolean | null>(null);
  const [showCamera, setShowCamera] = React.useState(false);
  const cameraRef = React.useRef<any>(null);

  const runningBookings = React.useMemo(
    () => (bookings ?? []).filter((booking) => booking.status === 'running'),
    [bookings]
  );

  React.useEffect(() => {
    if (!selectedBookingId && runningBookings.length > 0) {
      setSelectedBookingId(runningBookings[0].id);
    }
  }, [selectedBookingId, runningBookings]);

  React.useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  const handleTakePicture = async () => {
    if (!hasCameraPermission) {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to capture proof.');
        return;
      }
    }

    if (!hasLocationPermission) {
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === 'granted');
      if (locationStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to capture GPS coordinates.');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setActionError(null);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setCapturedImage(photo.uri);
      setCapturedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setCapturedAt(new Date());
      setShowCamera(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to capture image');
      setShowCamera(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Get current location
        if (!hasLocationPermission) {
          const locationStatus = await Location.requestForegroundPermissionsAsync();
          setHasLocationPermission(locationStatus.status === 'granted');
          if (locationStatus.status !== 'granted') {
            Alert.alert('Permission Required', 'Location permission is required to capture GPS coordinates.');
            return;
          }
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCapturedImage(result.assets[0].uri);
        setCapturedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setCapturedAt(new Date());
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to pick image');
    }
  };

  const handleUploadProof = async () => {
    setActionError(null);
    setSuccessMessage(null);

    if (!selectedBookingId) {
      setActionError('Select a running booking first.');
      return;
    }

    if (!capturedImage || !capturedLocation || !capturedAt) {
      setActionError('Please capture an image first.');
      return;
    }

    try {
      await uploadProof.mutateAsync({
        bookingId: selectedBookingId,
        imageUri: capturedImage,
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        capturedAt,
        notes: proofNote.trim() || undefined,
      });

      setSuccessMessage(
        'Proof uploaded successfully! Booking moved to awaiting_review.'
      );

      // Clear captured data
      setCapturedImage(null);
      setCapturedLocation(null);
      setCapturedAt(null);
      setProofNote('');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to upload proof'
      );
    }
  };

  if (isLoading && !bookings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Proof of Performance</Text>
          <Text style={styles.helper}>
            Capture a timestamped photo with GPS location to prove completion of your run.
          </Text>

          <Text style={styles.fieldLabel}>Select Running Booking</Text>
          {runningBookings.length === 0 ? (
            <Text style={styles.emptyText}>No running bookings available.</Text>
          ) : (
            <View style={styles.bookingList}>
              {runningBookings.map((booking) => {
                const selected = booking.id === selectedBookingId;
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.bookingChip, selected && styles.bookingChipSelected]}
                    onPress={() => setSelectedBookingId(booking.id)}
                  >
                    <Text
                      style={[
                        styles.bookingChipText,
                        selected && styles.bookingChipTextSelected,
                      ]}
                    >
                      {booking.id.slice(0, 8)} ({booking.slot?.region ?? 'Unknown'})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {capturedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.fieldLabel}>Captured Image</Text>
              <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
              {capturedLocation && (
                <Text style={styles.locationText}>
                  Location: {capturedLocation.latitude.toFixed(6)}, {capturedLocation.longitude.toFixed(6)}
                </Text>
              )}
              {capturedAt && (
                <Text style={styles.locationText}>
                  Captured: {capturedAt.toLocaleString()}
                </Text>
              )}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setCapturedImage(null);
                  setCapturedLocation(null);
                  setCapturedAt(null);
                }}
              >
                <Text style={styles.secondaryButtonText}>Clear Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.captureButtonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTakePicture}
              >
                <Text style={styles.primaryButtonText}>Take Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePickFromGallery}
              >
                <Text style={styles.secondaryButtonText}>Pick from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={proofNote}
            onChangeText={setProofNote}
            placeholder="Add any notes about this run..."
            multiline
          />

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TouchableOpacity
            style={[styles.uploadButton, (!capturedImage || uploadProof.isPending) && styles.disabledButton]}
            onPress={handleUploadProof}
            disabled={!capturedImage || uploadProof.isPending}
          >
            <Text style={styles.primaryButtonText}>
              {uploadProof.isPending ? 'Uploading...' : 'Upload Proof'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.mutedForeground,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  helper: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 6,
    marginTop: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
    fontSize: theme.fontSize.sm,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  bookingChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  bookingChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}12`,
  },
  bookingChipText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.xs,
  },
  bookingChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  captureButtonsContainer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  imagePreviewContainer: {
    marginTop: theme.spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  locationText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginBottom: 4,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  successText: {
    color: '#047857',
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  uploadButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
  },
  secondaryButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
  },
  bottomSpacing: {
    height: theme.spacing.lg,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  captureButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
