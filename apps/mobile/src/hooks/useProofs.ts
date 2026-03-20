import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, TOKEN_KEY } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingsKeys } from './useBookings';

export interface UploadProofParams {
  bookingId: string;
  imageUri: string;
  latitude: number;
  longitude: number;
  capturedAt: Date;
  notes?: string;
}

export interface ProofUploadResponse {
  id: string;
  bookingId: string;
  imageUrl: string;
  status: 'pending_review' | 'approved' | 'rejected';
  createdAt: string;
}

async function uploadProof(params: UploadProofParams): Promise<ProofUploadResponse> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create form data
  const formData = new FormData();

  // Add image file
  const uriParts = params.imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  formData.append('image', {
    uri: params.imageUri,
    name: `proof-${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  // Add metadata
  formData.append('bookingId', params.bookingId);
  formData.append('capturedAt', params.capturedAt.toISOString());
  formData.append('latitude', params.latitude.toString());
  formData.append('longitude', params.longitude.toString());
  if (params.notes?.trim()) {
    formData.append('notes', params.notes.trim());
  }

  // Upload to API
  const response = await fetch(`${API_BASE_URL}/proofs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload proof');
  }

  return response.json();
}

export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProof,
    onSuccess: (data, variables) => {
      // Invalidate bookings to refresh after proof upload
      // The booking status should change to 'awaiting_review'
      queryClient.invalidateQueries({ queryKey: bookingsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.bookingId),
      });
    },
  });
}
