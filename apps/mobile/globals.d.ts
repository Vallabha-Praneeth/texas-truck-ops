// Minimal process.env type shim for React Native / Expo projects.
// The `process` global is injected at runtime by Metro / Expo's build layer
// but TypeScript needs a declaration to avoid TS2580.
// We only declare what we actually use; @types/node is not a dep of this app.
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_ENV?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};
