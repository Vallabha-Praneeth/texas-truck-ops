import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RequestItem, RequestOffersResponse } from '@/types/api';

export const requestsKeys = {
  all: ['requests'] as const,
  lists: () => [...requestsKeys.all, 'list'] as const,
  list: (filters?: { region?: string; status?: string }) =>
    [...requestsKeys.lists(), filters] as const,
  details: () => [...requestsKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestsKeys.details(), id] as const,
  offers: (id: string) => [...requestsKeys.detail(id), 'offers'] as const,
};

export function useRequests(
  params?: { region?: string; status?: string },
  options?: Omit<UseQueryOptions<RequestItem[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestsKeys.list(params),
    queryFn: () => api.requests.list(params),
    staleTime: 20000,
    ...options,
  });
}

export function useRequest(
  id: string,
  options?: Omit<UseQueryOptions<RequestItem>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestsKeys.detail(id),
    queryFn: () => api.requests.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useRequestOffers(
  requestId: string,
  options?: Omit<UseQueryOptions<RequestOffersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestsKeys.offers(requestId),
    queryFn: () => api.requests.listOffers(requestId),
    enabled: Boolean(requestId),
    staleTime: 10000,
    ...options,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.requests.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.requests.update>[1] }) =>
      api.requests.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.requests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
    },
  });
}
