import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api, OffersListParams } from '@/lib/api';
import { Offer, OfferStatus } from '@/types/api';

export const offersKeys = {
  all: ['offers'] as const,
  lists: () => [...offersKeys.all, 'list'] as const,
  list: (filters?: OffersListParams) => [...offersKeys.lists(), filters] as const,
  details: () => [...offersKeys.all, 'detail'] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
};

export function useOffers(
  params?: OffersListParams,
  options?: Omit<UseQueryOptions<Offer[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: offersKeys.list(params),
    queryFn: () => api.offers.list(params),
    staleTime: 15000,
    ...options,
  });
}

export function useOffer(
  id: string,
  options?: Omit<UseQueryOptions<Offer>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: offersKeys.detail(id),
    queryFn: () => api.offers.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.offers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.offers.update>[1] }) =>
      api.offers.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.offers.accept(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.offers.reject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useUpdateOfferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Extract<OfferStatus, 'accepted' | 'rejected'>;
    }) => api.offers.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
