# Lottie Animation Assets

## Directory Structure
```
lottie/
├── icons/          # Small icon animations (<50kb)
│   ├── truck.json
│   ├── calendar.json
│   ├── search.json
│   └── ...
├── status/         # Status indicator animations
│   ├── loading.json
│   ├── success.json
│   ├── error.json
│   └── ...
└── onboarding/     # Larger onboarding animations
    └── ...
```

## Best Practices (Based on Previous Failures)

### ✅ DO:
1. **Use Lottie v5.7.4+ JSON format**
2. **Keep icon animations under 50kb**
3. **Test on both iOS and Android before committing**
4. **Use simple animations for UI icons (< 60 frames)**
5. **Store animations locally (not remote URLs)**
6. **Validate JSON structure before using**
7. **Use `loop` sparingly (can drain battery)**

### ❌ DON'T:
1. **Don't use complex path animations in icons**
2. **Don't embed large images in Lottie JSON**
3. **Don't use untested community animations**
4. **Don't rely on external asset references**
5. **Don't use more than 3 layers for icons**
6. **Don't forget fallback for animation failures**

## Animation Sources

### Recommended:
- LottieFiles.com (free/pro)
- Custom animations from After Effects
- UI8 Lottie packs

### Validation:
1. Upload to LottieFiles.com preview
2. Check file size < 50kb for icons
3. Test on Expo Go before integration
4. Verify frame count < 60 for icons

## Example Usage

```tsx
import { LottieIcon } from '@/components/LottieIcon';
import truckAnimation from '@/assets/lottie/icons/truck.json';

<LottieIcon
  source={truckAnimation}
  size={24}
  loop={false}
/>
```

## Fallback Strategy

Always provide a fallback icon from react-native-vector-icons:

```tsx
import { Truck } from 'lucide-react-native';

const IconComponent = ({ useLottie = true }) => {
  if (!useLottie) {
    return <Truck size={24} color="#000" />;
  }
  return <LottieIcon source={truckAnimation} size={24} />;
};
```
