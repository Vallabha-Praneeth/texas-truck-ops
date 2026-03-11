# API Integration Guide

## ✅ What's Been Implemented

### 1. **API Client** (`src/lib/api.ts`)
- ✅ Axios-based HTTP client with interceptors
- ✅ JWT token management (AsyncStorage)
- ✅ Automatic token injection in headers
- ✅ 401 error handling (token expiration)
- ✅ Typed API methods for all endpoints

### 2. **React Query Hooks** (`src/hooks/`)
- ✅ **useSlots** - Fetch availability slots
- ✅ **useSlot** - Fetch single slot
- ✅ **useCreateSlot** - Create new slot
- ✅ **useUpdateSlot** - Update slot
- ✅ **useDeleteSlot** - Delete slot
- ✅ **useOffers** - Fetch offers (with filters)
- ✅ **useAcceptOffer** - Accept offer
- ✅ **useRejectOffer** - Reject offer
- ✅ **useCounterOffer** - Counter offer
- ✅ **useBookings** - Fetch bookings
- ✅ **useTrucks** - Fetch trucks

### 3. **Operator Dashboard Integration**
- ✅ Real-time data fetching with React Query
- ✅ Loading states with spinner
- ✅ Error states with retry
- ✅ Pull-to-refresh functionality
- ✅ Empty states
- ✅ KPI metrics from API data

---

## 🔧 Configuration

### Environment Variables

**File: `.env`**
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_ENV=development
```

**For Production:**
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_ENV=production
```

---

## 📖 API Client Usage

### Basic Usage

```typescript
import { api } from '@/lib/api';

// Slots
const slots = await api.slots.list();
const slot = await api.slots.get('slot-id');
await api.slots.create({ truckId, startAt, endAt, region });

// Offers
const offers = await api.offers.list({ status: 'pending' });
await api.offers.accept('offer-id');
await api.offers.reject('offer-id');

// Bookings
const bookings = await api.bookings.list({ status: 'confirmed' });
```

### Token Management

```typescript
import { apiClient } from '@/lib/api';

// Set token after login
await apiClient.setToken('jwt-token-here');

// Get current token
const token = await apiClient.getToken();

// Clear token (logout)
await apiClient.clearToken();
```

---

## 🪝 React Query Hooks Usage

### Queries (Data Fetching)

```typescript
import { useSlots, useOffers, useBookings } from '@/hooks';

function MyComponent() {
  // Fetch all slots
  const { data, isLoading, error, refetch } = useSlots();

  // Fetch slots with filters
  const { data: filteredSlots } = useSlots({
    region: 'DFW',
    startDate: '2024-01-15'
  });

  // Fetch single slot
  const { data: slot } = useSlot(slotId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView error={error} />;

  return <SlotsList slots={data} />;
}
```

### Mutations (Data Updates)

```typescript
import { useCreateSlot, useAcceptOffer, useCancelBooking } from '@/hooks';

function MyComponent() {
  const createSlot = useCreateSlot();
  const acceptOffer = useAcceptOffer();
  const cancelBooking = useCancelBooking();

  const handleCreateSlot = async () => {
    try {
      await createSlot.mutateAsync({
        truckId: 'truck-123',
        startAt: '2024-01-15T18:00:00Z',
        endAt: '2024-01-15T22:00:00Z',
        region: 'DFW',
        radiusMiles: 50,
      });
      // Success!
    } catch (error) {
      // Handle error
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptOffer.mutateAsync(offerId);
      // Offer accepted! Related queries auto-refresh
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View>
      <Button
        onPress={handleCreateSlot}
        loading={createSlot.isPending}
      >
        Create Slot
      </Button>
      <Button
        onPress={() => handleAcceptOffer('offer-123')}
        loading={acceptOffer.isPending}
      >
        Accept Offer
      </Button>
    </View>
  );
}
```

---

## 🔄 Automatic Cache Invalidation

React Query automatically refetches related data when mutations succeed:

```typescript
// When you accept an offer...
await acceptOffer.mutateAsync('offer-123');

// These queries automatically refetch:
// - useOffer('offer-123') - individual offer
// - useOffers() - offers list
// - useSlots() - slots (because slot status may change)
```

This is configured in the mutation hooks:

```typescript
export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.offers.accept(id),
    onSuccess: (_, id) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: offersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offersKeys.lists() });
    },
  });
}
```

---

## 📱 Real-World Examples

### Example 1: Operator Dashboard (Already Implemented)

```typescript
export const OperatorDashboard = () => {
  const { data: slots, isLoading, error, refetch } = useSlots();
  const { data: offers } = useOffers({ status: 'pending' });
  const { data: bookings } = useBookings();

  const activeSlots = slots?.filter(s => s.status === 'available').length || 0;
  const pendingOffers = offers?.length || 0;

  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={refetch} />}>
      <KPICard label="Active Slots" value={activeSlots} />
      <KPICard label="Pending Offers" value={pendingOffers} />
      {slots?.map(slot => <SlotCard key={slot.id} slot={slot} />)}
    </ScrollView>
  );
};
```

### Example 2: Create Slot Form

```typescript
import { useCreateSlot } from '@/hooks';

export const CreateSlotForm = () => {
  const createSlot = useCreateSlot();
  const [formData, setFormData] = useState({
    truckId: '',
    startAt: '',
    endAt: '',
    region: 'DFW',
  });

  const handleSubmit = async () => {
    try {
      await createSlot.mutateAsync(formData);
      // Navigate back or show success
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create slot');
    }
  };

  return (
    <View>
      <TextInput
        value={formData.truckId}
        onChangeText={(text) => setFormData({ ...formData, truckId: text })}
      />
      <Button
        onPress={handleSubmit}
        loading={createSlot.isPending}
        disabled={createSlot.isPending}
      >
        Create Slot
      </Button>
    </View>
  );
};
```

### Example 3: Accept/Reject Offers

```typescript
import { useAcceptOffer, useRejectOffer } from '@/hooks';

export const OfferDetailScreen = ({ route }) => {
  const { offerId } = route.params;
  const { data: offer } = useOffer(offerId);
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();

  const handleAccept = async () => {
    try {
      await acceptOffer.mutateAsync(offerId);
      Alert.alert('Success', 'Offer accepted!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept offer');
    }
  };

  const handleReject = async () => {
    try {
      await rejectOffer.mutateAsync(offerId);
      Alert.alert('Success', 'Offer rejected');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject offer');
    }
  };

  return (
    <View>
      <Text>Amount: ${offer.amountCents / 100}</Text>
      <Button onPress={handleAccept} loading={acceptOffer.isPending}>
        Accept
      </Button>
      <Button onPress={handleReject} loading={rejectOffer.isPending}>
        Reject
      </Button>
    </View>
  );
};
```

---

## 🔒 Authentication Flow

### Login Process

```typescript
import { api, apiClient } from '@/lib/api';

// Step 1: Request OTP
await api.auth.login('+15551234567');
// Backend sends OTP via SMS

// Step 2: Verify OTP
const { token, user } = await api.auth.verifyOtp('+15551234567', '123456');

// Step 3: Store token
await apiClient.setToken(token);

// Step 4: All subsequent API calls automatically include token
const profile = await api.auth.getProfile();
```

### Logout Process

```typescript
// Clear stored token
await apiClient.clearToken();

// Navigate to login screen
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
```

---

## 🛠️ Error Handling

### Global Error Handling

The API client automatically handles 401 errors:

```typescript
// In api.ts
this.client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired
      await this.clearToken();
      // TODO: Navigate to login
    }
    return Promise.reject(error);
  }
);
```

### Component-Level Error Handling

```typescript
const { data, error, isError } = useSlots();

if (isError) {
  return (
    <View>
      <Text>Error: {error.message}</Text>
      <Button onPress={() => refetch()}>Retry</Button>
    </View>
  );
}
```

### Mutation Error Handling

```typescript
const createSlot = useCreateSlot();

try {
  await createSlot.mutateAsync(data);
} catch (error) {
  if (error.response?.status === 400) {
    Alert.alert('Validation Error', error.response.data.message);
  } else if (error.response?.status === 409) {
    Alert.alert('Conflict', 'Slot already exists for this time');
  } else {
    Alert.alert('Error', 'Something went wrong');
  }
}
```

---

## 🚀 Next Steps

### Authentication Screens (TODO)

```typescript
// src/screens/auth/Login.tsx
import { api, apiClient } from '@/lib/api';

export const LoginScreen = () => {
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    await api.auth.login(phone);
    navigation.navigate('OTPVerification', { phone });
  };

  return (
    <View>
      <TextInput value={phone} onChangeText={setPhone} />
      <Button onPress={handleLogin}>Send OTP</Button>
    </View>
  );
};

// src/screens/auth/OTPVerification.tsx
export const OTPVerificationScreen = ({ route }) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');

  const handleVerify = async () => {
    const { token } = await api.auth.verifyOtp(phone, otp);
    await apiClient.setToken(token);
    navigation.replace('OperatorDashboard');
  };

  return (
    <View>
      <TextInput value={otp} onChangeText={setOtp} />
      <Button onPress={handleVerify}>Verify</Button>
    </View>
  );
};
```

### Offline Support (TODO)

Add React Query persistence:

```typescript
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
```

---

## 📊 Query Keys Structure

Query keys are organized hierarchically:

```typescript
// Slots
['slots'] - All slots data
['slots', 'list'] - All slot lists
['slots', 'list', { filters }] - Filtered slot list
['slots', 'detail'] - All slot details
['slots', 'detail', 'slot-123'] - Specific slot

// Offers
['offers'] - All offers data
['offers', 'list', { status: 'pending' }] - Pending offers
['offers', 'detail', 'offer-123'] - Specific offer

// This structure allows precise cache invalidation
```

---

## 🧪 Testing API Integration

### Manual Testing Steps

1. **Start Backend API:**
   ```bash
   cd packages/api
   pnpm dev
   ```

2. **Start Mobile App:**
   ```bash
   cd apps/mobile
   pnpm dev
   ```

3. **Test Endpoints:**
   - Pull to refresh → Should fetch data
   - Check network tab for requests
   - Verify loading states
   - Test error states (stop backend)

### Testing Without Backend

Use MSW (Mock Service Worker) or modify hooks to return mock data:

```typescript
// In development, you can mock the API
const MOCK_MODE = __DEV__ && false; // Set to true to use mocks

export function useSlots() {
  if (MOCK_MODE) {
    return {
      data: mockSlots,
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return useQuery({
    queryKey: slotsKeys.lists(),
    queryFn: () => api.slots.list(),
  });
}
```

---

## ✅ Status Summary

**✅ Complete:**
- API client with token management
- All React Query hooks
- Operator Dashboard integration
- Loading & error states
- Pull-to-refresh
- Automatic cache invalidation

**🔄 Next:**
- Authentication screens (Login, OTP)
- More operator screens (Trucks, Slot creation)
- Broker & Driver screens
- Offline support
- Push notifications

---

**Integration Status:** ✅ Complete and Ready
**Backend Compatibility:** NestJS API @ `http://localhost:3001/api`
