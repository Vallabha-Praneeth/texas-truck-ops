# Mobile App Implementation Guide

## ✅ What's Been Built

### 1. **Core UI Components** (Ported from `__ui_reference`)
- ✅ **KPICard** - Dashboard metrics display
- ✅ **SlotCard** - Availability slot cards with pricing, status, region
- ✅ **StatusBadge** - Status indicators with animation support
- ✅ **RegionChip** - Texas region chips (DFW, Houston, Austin, etc.)
- ✅ **LottieIcon** - Reusable Lottie animation wrapper

### 2. **Screens**
- ✅ **OperatorDashboard** - Main operator view with:
  - KPI cards (Active Slots, Pending Offers, Bookings, Revenue)
  - Availability slots list
  - Quick actions
  - Pull-to-refresh

### 3. **Configuration**
- ✅ Lottie animations setup (`lottie-react-native`)
- ✅ NativeWind (Tailwind for React Native)
- ✅ Path aliases (`@/...` imports)
- ✅ Theme system matching UI reference
- ✅ TypeScript configuration

## 📦 Installed Packages

```json
{
  "dependencies": {
    "lottie-react-native": "^7.3.5",
    "@tanstack/react-query": "^5.90.20",
    "axios": "^1.13.5",
    "zustand": "^5.0.11",
    "nativewind": "^4.2.1",
    "tailwindcss": "^3.4.19"
  },
  "devDependencies": {
    "babel-plugin-module-resolver": "^5.0.2",
    "react-native-css-transformer": "^2.0.0"
  }
}
```

## 🎨 Lottie Integration Best Practices

Based on previous failures (user mentioned but files not found), here are the safeguards implemented:

### ✅ DO:
1. **Use validated Lottie JSON** (v5.7.4+)
2. **Keep animations small** (<50kb for icons)
3. **Test on both iOS and Android**
4. **Use simple animations for UI**
5. **Store locally** (not remote URLs)

### ❌ DON'T:
1. Complex path animations
2. Embedded large images
3. Untested community animations
4. External asset references
5. More than 3 layers for icons

### Component Usage:
```tsx
import { LottieIcon } from '@/components/LottieIcon';
import loadingAnimation from '@/assets/lottie/icons/loading.json';

<LottieIcon
  source={loadingAnimation}
  size={24}
  loop={true}
  autoPlay={true}
/>
```

## 🚀 How to Run

1. **Start the development server:**
   ```bash
   cd apps/mobile
   pnpm dev
   ```

2. **Run on device/simulator:**
   ```bash
   # iOS
   pnpm ios

   # Android
   pnpm android

   # Web (for testing)
   pnpm web
   ```

## 🎯 Next Steps

### Immediate (Task #3 - In Progress):
- [ ] **Setup API Client** (`src/lib/api.ts`)
  - Create axios instance with base URL
  - Add auth interceptors
  - Error handling

- [ ] **Setup React Query**
  - Create query hooks for:
    - `useSlots()` - Fetch availability slots
    - `useOffers()` - Fetch offers
    - `useBookings()` - Fetch bookings
  - Add mutations for CRUD operations

### Phase 2:
- [ ] **Navigation Setup**
  - Add React Navigation
  - Create tab navigator (Operator/Broker/Driver)
  - Stack navigators for each role

- [ ] **Authentication Screens**
  - Login screen (phone input)
  - OTP verification screen
  - JWT token storage

- [ ] **Additional Operator Screens**
  - Truck management (list, add, edit)
  - Slot creation/editing
  - Offers list and detail
  - Booking detail

### Phase 3:
- [ ] **Broker Screens**
  - Marketplace search
  - Slot browsing
  - Create offer
  - Negotiations

- [ ] **Driver Screens**
  - Runs dashboard
  - Run detail
  - Proof upload (camera + location)

### Phase 4:
- [ ] **Real-time Features**
  - WebSocket connection for live updates
  - Push notifications
  - Status changes

- [ ] **Offline Support**
  - React Query persistence
  - Queue mutations when offline

## 📁 Project Structure

```
apps/mobile/
├── src/
│   ├── assets/
│   │   └── lottie/
│   │       ├── icons/          # Small icon animations
│   │       ├── status/         # Status indicators
│   │       └── README.md       # Animation guidelines
│   ├── components/
│   │   ├── cards/
│   │   │   ├── KPICard.tsx
│   │   │   └── SlotCard.tsx
│   │   ├── ui/
│   │   │   ├── StatusBadge.tsx
│   │   │   └── RegionChip.tsx
│   │   ├── LottieIcon.tsx
│   │   └── index.ts
│   ├── screens/
│   │   ├── auth/              # Login, OTP (TODO)
│   │   ├── operator/
│   │   │   └── OperatorDashboard.tsx
│   │   ├── broker/            # (TODO)
│   │   ├── driver/            # (TODO)
│   │   └── shared/            # (TODO)
│   ├── lib/
│   │   ├── theme.ts           # Theme configuration
│   │   ├── api.ts             # API client (TODO)
│   │   └── utils.ts           # Utilities (TODO)
│   ├── hooks/                 # Custom hooks (TODO)
│   └── types/                 # TypeScript types (TODO)
├── App.tsx
├── babel.config.js
├── tailwind.config.js
└── package.json
```

## 🔗 API Integration Example

```typescript
// src/lib/api.ts (TODO)
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const slotsApi = {
  list: () => api.get('/slots'),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.patch(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
};
```

## 🧪 Testing

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests (when added)
pnpm test
```

## 🐛 Common Issues

### Lottie animations not showing:
1. Check JSON format is v5.7.4+
2. Verify file path is correct
3. Test on device (not just simulator)
4. Check animation has visible layers

### Path imports not working:
1. Restart Metro bundler
2. Clear cache: `pnpm start --clear`
3. Verify babel.config.js has module-resolver

### Type errors:
1. Run `pnpm typecheck` to see details
2. Check theme.ts fontWeight types
3. Ensure all imports use `@/` prefix

## 📚 Resources

- [Lottie React Native](https://github.com/lottie-react-native/lottie-react-native)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Expo Navigation](https://docs.expo.dev/guides/routing-and-navigation/)
- [LottieFiles](https://lottiefiles.com/) - Animation library

---

**Status:** ✅ Foundation Complete
**Next:** Setup API client and connect to backend
