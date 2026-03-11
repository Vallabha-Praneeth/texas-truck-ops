import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  DriverLocationPayload,
  DriverLocationState,
} from '@/lib/api';

export const driverLocationKeys = {
  all: ['driverLocation'] as const,
  me: () => [...driverLocationKeys.all, 'me'] as const,
};

export function useDriverLocation(enabled = true) {
  return useQuery<DriverLocationState>({
    queryKey: driverLocationKeys.me(),
    queryFn: () => api.drivers.getMyLocation(),
    enabled,
    staleTime: 15000,
  });
}

export function useUpdateDriverLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DriverLocationPayload) =>
      api.drivers.updateMyLocation(payload),
    onSuccess: (location) => {
      queryClient.setQueryData(driverLocationKeys.me(), location);
    },
  });
}
