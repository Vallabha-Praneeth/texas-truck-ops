import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { bookingsKeys } from './useBookings';

export function useCreateDepositSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      amountCents,
      successUrl,
      cancelUrl,
    }: {
      bookingId: string;
      amountCents: number;
      successUrl: string;
      cancelUrl: string;
    }) =>
      api.payments.createDepositSession(
        bookingId,
        amountCents,
        successUrl,
        cancelUrl
      ),
    onSuccess: (_, variables) => {
      // Invalidate bookings to refresh after payment
      queryClient.invalidateQueries({ queryKey: bookingsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingsKeys.detail(variables.bookingId),
      });
    },
  });
}
