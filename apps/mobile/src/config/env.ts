import { Platform } from 'react-native';

/**
 * Centrally managed API environment configuration.
 * Prioritizes the Expo ENV variable, falling back to simulator defaults.
 */
export const getApiBaseUrl = (): string => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    return Platform.OS === 'android'
        ? 'http://10.0.2.2:3001/api'
        : 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();
