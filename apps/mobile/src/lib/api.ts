import axios from 'axios/dist/browser/axios.cjs';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthSessionResponse,
  BookingStatus,
  BookingDetails,
  BookingSummary,
  Offer,
  OfferStatus,
  Organization,
  RequestOffersResponse,
  RequestItem,
  Slot,
  Truck,
  UserMembershipsResponse,
  UserProfile,
  OtpResponse,
} from '@/types/api';

export const TOKEN_KEY = '@led_billboard_token';
export const USER_KEY = '@led_billboard_user';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api';

// Use a shorter timeout outside production so UI tests and local dev don't
// wait the full 15 s for a slow/unreachable backend before queries resolve to
// an error state.  10 s is generous enough to accommodate cold-start NestJS
// processes (which can take 3-5 s on the first authenticated request) while
// still failing quickly when the backend is truly unreachable on localhost.
const API_TIMEOUT =
  process.env.EXPO_PUBLIC_ENV === 'production' ? 15000 : 10000;

export interface DriverLocationPayload {
  latitude: number;
  longitude: number;
  isOnline?: boolean;
  bookingId?: string | null;
}

export interface DriverLocationState {
  userId: string;
  bookingId: string | null;
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
  lastSeenAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SlotsSearchParams = {
  region?: string;
  startAt?: string;
  endAt?: string;
  limit?: number;
  offset?: number;
};

export type OffersListParams = {
  requestId?: string;
  slotId?: string;
  status?: OfferStatus;
};

type CreateSlotPayload = {
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed?: boolean;
  maxRepositionMiles?: number;
  notes?: string;
};

type UpdateSlotPayload = Partial<CreateSlotPayload>;

type CreateOfferPayload = {
  requestId?: string;
  slotId?: string;
  amountCents: number;
  currency?: string;
  terms?: Record<string, unknown>;
  expiresAt?: string;
};

type UpdateOfferPayload = {
  amountCents?: number;
  terms?: Record<string, unknown>;
  status?: OfferStatus;
};

type UpdateBookingStatusPayload = {
  status: BookingStatus;
  cancellationReason?: string;
};

type CreateRequestPayload = {
  region: string;
  title: string;
  description: string;
  preferredStartAt: string;
  preferredEndAt: string;
  budgetCents?: number;
  minScreenWidthFt?: string;
};

type UpdateRequestPayload = Partial<CreateRequestPayload>;

type CreateTruckPayload = {
  orgId: string;
  nickname: string;
  plateNumber: string;
  screenSizeFt: string;
  baseRegion: string;
};

type CreateOrganizationPayload = {
  name: string;
  type: 'operator' | 'broker';
  contactPhone: string;
  contactEmail?: string;
  taxId?: string;
};

class ApiClient {
  private client: AxiosInstance;
  private unauthorizedHandler: (() => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.clearSession();
          this.unauthorizedHandler?.();
        }
        return Promise.reject(error);
      }
    );
  }

  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.unauthorizedHandler = handler;
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async getStoredUser<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      await AsyncStorage.removeItem(USER_KEY);
      return null;
    }
  }

  async setStoredUser<T>(user: T): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async clearSession(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }

  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete(url: string, config: AxiosRequestConfig = {}): Promise<void> {
    await this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();

export const api = {
  auth: {
    sendOtp: (phone: string) =>
      apiClient.post<OtpResponse>('/auth/send-otp', { phone }),
    login: (phone: string) =>
      apiClient.post<OtpResponse>('/auth/login', { phone }),
    verifyOtp: (phone: string, code: string) =>
      apiClient.post<AuthSessionResponse>('/auth/verify-otp', {
        phone,
        code,
      }),
    loginWithPassword: (username: string, password: string) =>
      apiClient.post<AuthSessionResponse>('/auth/password-login', {
        username,
        password,
      }),
    getProfile: () => apiClient.get<UserProfile>('/auth/profile'),
  },

  users: {
    getMe: () => apiClient.get<UserProfile>('/users/me'),
    getMemberships: () =>
      apiClient.get<UserMembershipsResponse>('/users/me/organizations'),
  },

  trucks: {
    list: () => apiClient.get<Truck[]>('/trucks'),
    create: (data: CreateTruckPayload) =>
      apiClient.post<Truck>('/trucks', data),
  },

  slots: {
    list: (params?: SlotsSearchParams) =>
      apiClient.get<Slot[]>('/slots/search', { params }),
    get: (id: string) => apiClient.get<Slot>(`/slots/${id}`),
    create: (data: CreateSlotPayload) => apiClient.post<Slot>('/slots', data),
    update: (id: string, data: UpdateSlotPayload) =>
      apiClient.patch<Slot>(`/slots/${id}`, data),
    delete: (id: string) => apiClient.delete(`/slots/${id}`),
  },

  offers: {
    list: (params?: OffersListParams) =>
      apiClient.get<Offer[]>('/offers', { params }),
    get: (id: string) => apiClient.get<Offer>(`/offers/${id}`),
    create: (data: CreateOfferPayload) =>
      apiClient.post<Offer>('/offers', data),
    update: (id: string, data: UpdateOfferPayload) =>
      apiClient.patch<Offer>(`/offers/${id}`, data),
    accept: (id: string) =>
      apiClient.patch<Offer>(`/offers/${id}`, { status: 'accepted' }),
    reject: (id: string) =>
      apiClient.patch<Offer>(`/offers/${id}`, { status: 'rejected' }),
    counter: (
      id: string,
      data: { amountCents: number; terms?: Record<string, unknown> }
    ) =>
      apiClient.patch<Offer>(`/offers/${id}`, {
        ...data,
        status: 'countered',
      }),
  },

  requests: {
    list: (params?: { region?: string; status?: string }) =>
      apiClient.get<RequestItem[]>('/requests', { params }),
    get: (id: string) => apiClient.get<RequestItem>(`/requests/${id}`),
    create: (data: CreateRequestPayload) =>
      apiClient.post<RequestItem>('/requests', data),
    update: (id: string, data: UpdateRequestPayload) =>
      apiClient.patch<RequestItem>(`/requests/${id}`, data),
    listOffers: (requestId: string) =>
      apiClient.get<RequestOffersResponse>(`/requests/${requestId}/offers`),
    delete: (id: string) => apiClient.delete(`/requests/${id}`),
  },

  bookings: {
    list: () => apiClient.get<BookingSummary[]>('/bookings'),
    get: (id: string) => apiClient.get<BookingDetails>(`/bookings/${id}`),
    updateStatus: (id: string, data: UpdateBookingStatusPayload) =>
      apiClient.patch<BookingDetails>(`/bookings/${id}/status`, data),
  },

  drivers: {
    getMyLocation: () =>
      apiClient.get<DriverLocationState>('/drivers/me/location'),
    updateMyLocation: (data: DriverLocationPayload) =>
      apiClient.patch<DriverLocationState>('/drivers/me/location', data),
  },

  organizations: {
    list: () => apiClient.get<Organization[]>('/organizations'),
    create: (data: CreateOrganizationPayload) =>
      apiClient.post<Organization>('/organizations', data),
    getMembers: (id: string) =>
      apiClient.get<
        {
          userId: string;
          role: string;
          joinedAt: string;
          user: {
            displayName: string | null;
            phone: string | null;
            email: string | null;
          };
        }[]
      >(`/organizations/${id}/members`),
  },
};
