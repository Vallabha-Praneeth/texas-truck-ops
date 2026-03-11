import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UserMembershipsResponse } from '@/types/api';

export const userKeys = {
  me: ['users', 'me'] as const,
  memberships: ['users', 'me', 'memberships'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => api.users.getMe(),
    staleTime: 60000,
  });
}

export function useMemberships(
  options?: Omit<UseQueryOptions<UserMembershipsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.memberships,
    queryFn: () => api.users.getMemberships(),
    staleTime: 60000,
    ...options,
  });
}
