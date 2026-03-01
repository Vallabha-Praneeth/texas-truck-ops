import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const trucksKeys = {
  all: ['trucks'] as const,
  lists: () => [...trucksKeys.all, 'list'] as const,
  list: () => [...trucksKeys.lists()] as const,
};

export function useTrucks() {
  return useQuery({
    queryKey: trucksKeys.list(),
    queryFn: () => api.trucks.list(),
    staleTime: 60000,
  });
}

export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.trucks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trucksKeys.lists() });
    },
  });
}
