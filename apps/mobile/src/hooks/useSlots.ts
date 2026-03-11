import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api, SlotsSearchParams } from '@/lib/api';
import { Slot } from '@/types/api';

export const slotsKeys = {
  all: ['slots'] as const,
  lists: () => [...slotsKeys.all, 'list'] as const,
  list: (filters?: SlotsSearchParams) => [...slotsKeys.lists(), filters] as const,
  details: () => [...slotsKeys.all, 'detail'] as const,
  detail: (id: string) => [...slotsKeys.details(), id] as const,
};

export function useSlots(
  params?: SlotsSearchParams,
  options?: Omit<UseQueryOptions<Slot[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: slotsKeys.list(params),
    queryFn: () => api.slots.list(params),
    staleTime: 30000,
    ...options,
  });
}

export function useSlot(
  id: string,
  options?: Omit<UseQueryOptions<Slot>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: slotsKeys.detail(id),
    queryFn: () => api.slots.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.slots.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotsKeys.lists() });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.slots.update>[1] }) =>
      api.slots.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: slotsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: slotsKeys.lists() });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.slots.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotsKeys.lists() });
    },
  });
}

export function useSearchSlots() {
  return useMutation({
    mutationFn: (params: SlotsSearchParams) => api.slots.list(params),
  });
}
