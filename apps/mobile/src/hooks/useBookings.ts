import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookingDetails, BookingStatus, BookingSummary } from '@/types/api';

export const bookingsKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingsKeys.all, 'list'] as const,
  list: () => [...bookingsKeys.lists()] as const,
  details: () => [...bookingsKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingsKeys.details(), id] as const,
};

export function useBookings(
  options?: Omit<UseQueryOptions<BookingSummary[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bookingsKeys.list(),
    queryFn: () => api.bookings.list(),
    staleTime: 20000,
    ...options,
  });
}

export function useBooking(
  id: string,
  options?: Omit<UseQueryOptions<BookingDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bookingsKeys.detail(id),
    queryFn: () => api.bookings.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      cancellationReason,
    }: {
      id: string;
      status: BookingStatus;
      cancellationReason?: string;
    }) => api.bookings.updateStatus(id, { status, cancellationReason }),
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(bookingsKeys.detail(updatedBooking.id), updatedBooking);
      queryClient.invalidateQueries({ queryKey: bookingsKeys.lists() });
    },
  });
}
